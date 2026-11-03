const Sequelize = require('sequelize');
const db = require('../database');
const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

const MUN_MIN_FRACTION = 0.05; // fração mínima do município dentro do território para contar
const TTL_MS = 60 * 60 * 1000; // rede de segurança; a invalidação normal é ao gravar a atuação ou em "Recarregar"

/*
 * Fontes das iniciativas que entram no painel. Só versão 'current'; `stable` é o id estável (não o id da versão).
 * `geoTable.fk` aponta para a linha de versão da tabela principal.
 */
const SOURCES = [
  { categoria: 'politicas', main: 'ppea.politicas', stable: 'politica_id', geo: 'ppea.politicas_atuacao', fk: 'politica_versao_id' },
  { categoria: 'colegiados', main: 'ciea.comissoes', stable: 'iniciativa_id', geo: 'ciea.comissao_atuacao', fk: 'iniciativa_versao_id' },
  { categoria: 'cecsas', main: 'cne.cnes', stable: 'cne_id', geo: 'cne.cnes_atuacao', fk: 'cne_versao_id' },
  { categoria: 'projetos', main: 'iniciativas.iniciativas', stable: 'politica_id', geo: 'iniciativas.iniciativas_atuacao', fk: 'politica_versao_id' },
];

/*
 * Território de atuação das iniciativas "guarda-chuva" (schema `territorial`, ver migrations/2.29.1/guarda-chuva.sql).
 * Não há versionamento (draft/current): as geometrias ficam direto em territorial.atuacao.iniciativa_id.
 */
class Service {
  constructor() {
    this.cache = new Map(); // iniciativa territorial id -> { at, promise }
  }

  /*
   * Iniciativas (current) cuja atuação intersecta a atuação do GT territorial. Resultado em cache, um por GT:
   * { items: [{ categoria, id }], total, porCategoria: { politicas, colegiados, cecsas, projetos },
   *   municipios: [{ cd_mun, nome, uf }] }
   */
  getPanel(id) {
    const key = String(id);
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;

    const promise = this.buildPanel(id);
    this.cache.set(key, { at: Date.now(), promise });
    promise.catch(() => this.cache.delete(key)); // não guarda falha
    return promise;
  }

  invalidate(id) {
    if (id === undefined) this.cache.clear();
    else this.cache.delete(String(id));
  }

  async buildPanel(id) {
    const sequelize = db.instance();
    const territorio = `
      with t as (
        select ST_MakeValid(ST_Union(ST_MakeValid(ST_SetSRID(geom, 4326)))) as geom
        from territorial.atuacao
        where iniciativa_id = :id
      )`;

    const porCategoria = { politicas: 0, colegiados: 0, cecsas: 0, projetos: 0 };
    const items = [];

    for (const src of SOURCES) {
      const rows = await sequelize.query(
        `${territorio}
        select distinct p.${src.stable} as id
        from ${src.geo} a
        inner join ${src.main} p on p.id = a.${src.fk} and p.versao = 'current' and p."deletedAt" is null
        cross join t
        where t.geom is not null
          and a.geom is not null
          and ST_Intersects(ST_SetSRID(a.geom, 4326), t.geom)
        order by 1`,
        { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
      );

      porCategoria[src.categoria] = rows.length;
      rows.forEach(r => items.push({ categoria: src.categoria, id: r.id }));
    }

    // municípios cobertos pelo território: ao menos MUN_MIN_FRACTION da área do município dentro do território
    // (descarta municípios vizinhos que só encostam ou sobrepõem em fatias nas divisas)
    const municipios = await sequelize.query(
      `${territorio},
      m as (
        select m.cd_mun, m.nm_mun, m.nm_uf, ST_MakeValid(ST_Transform(m.geom, 4326)) as geom
        from municipios m
        cross join t
        where t.geom is not null and m.geom is not null
          and ST_Intersects(ST_Transform(m.geom, 4326), t.geom)
      )
      select m.cd_mun, m.nm_mun as nome, m.nm_uf as uf
      from m
      cross join t
      where ST_Area(ST_Intersection(m.geom, t.geom)) >= :fraction * ST_Area(m.geom)
      order by m.nm_mun`,
      { replacements: { id, fraction: MUN_MIN_FRACTION }, type: Sequelize.QueryTypes.SELECT },
    );

    return { items, total: items.length, porCategoria, municipios };
  }

  /* Retorna o id da iniciativa relacionada a uma comunidade */
  async getIdFromCommunity(community_id) {
    const result = await db.instance().query(
      `select id from territorial.iniciativas where community_id = :community_id and "deletedAt" is null`,
      { replacements: { community_id }, type: Sequelize.QueryTypes.SELECT },
    );

    if (!result.length) return null;

    return { id: result[0].id };
  }

  async getGeoDraw(id) {
    const sequelize = db.instance();

    const geoms = await sequelize.query(
      `select ST_AsGeoJSON((ST_Dump(ST_Simplify(a.geom,0.001))).geom)::jsonb as geojson
       from territorial.atuacao a
       where a.iniciativa_id = :id`,
      { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
    );

    const bbox = await sequelize.query(
      `select st_xmin(bb) as bbxmin, st_ymin(bb) as bbymin, st_xmax(bb) as bbxmax, st_ymax(bb) as bbymax
       from (select ST_Extent(geom) as bb from territorial.atuacao where iniciativa_id = :id) s1`,
      { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
    );

    return {
      geoms: geoms.map(({ geojson }) => geojson),
      bbox: [
        [bbox[0].bbymin, bbox[0].bbxmin],
        [bbox[0].bbymax, bbox[0].bbxmax],
      ],
    };
  }

  async getGeoDrawSave(id, geoms) {
    const sequelize = db.instance();

    const exists = await sequelize.query(`select id from territorial.iniciativas where id = :id and "deletedAt" is null`, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (!exists.length) throw new Error('Unknown iniciativa!');

    await sequelize.transaction(async transaction => {
      await sequelize.query(`delete from territorial.atuacao where iniciativa_id = :id`, {
        replacements: { id },
        type: Sequelize.QueryTypes.DELETE,
        transaction,
      });

      for (const geom of geoms || []) {
        await sequelize.query(
          `insert into territorial.atuacao(iniciativa_id, geom) values(:id, ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))`,
          {
            replacements: { id, geom: JSON.stringify(geom) },
            type: Sequelize.QueryTypes.INSERT,
            transaction,
          },
        );
      }
    });

    this.invalidate(id); // a cobertura mudou: o painel precisa ser recalculado

    return { ok: true };
  }

  async importSHP(filePath) {
    const source = await shapefile.openShp(filePath);
    const result = await source.read();

    const feature = {
      type: 'Feature',
      geometry: result.value,
      properties: { name: 'co2' },
    };

    return { geojson: simplify(feature, 0.001) };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
