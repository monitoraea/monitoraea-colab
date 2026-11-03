const Sequelize = require('sequelize');
const db = require('../database');
const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

const MUN_MIN_FRACTION = 0.05; // fração mínima do município dentro do território para contar
const TTL_MS = 60 * 60 * 1000; // rede de segurança; a invalidação normal é ao gravar a atuação ou em "Recarregar"

/*
 * Fontes das iniciativas que entram no painel. `stable` é o id estável (não o id da versão); `fk` aponta, na tabela de
 * atuação, para a linha da tabela principal. Por padrão só entram versões 'current' não excluídas, com geometria sem SRID
 * (assumida 4326). Cada fonte pode trocar o filtro (`where`) e a conversão da geometria (`geom`, expressão sobre `a.geom`).
 */
const DEFAULT_WHERE = `p.versao = 'current' and p."deletedAt" is null`;
const DEFAULT_GEOM = 'ST_SetSRID(a.geom, 4326)';

const SOURCES = [
  { categoria: 'politicas', main: 'ppea.politicas', stable: 'politica_id', geo: 'ppea.politicas_atuacao', fk: 'politica_versao_id' },
  { categoria: 'colegiados', main: 'ciea.comissoes', stable: 'iniciativa_id', geo: 'ciea.comissao_atuacao', fk: 'iniciativa_versao_id' },
  { categoria: 'cecsas', main: 'cne.cnes', stable: 'cne_id', geo: 'cne.cnes_atuacao', fk: 'cne_versao_id' },
  { categoria: 'projetos', main: 'iniciativas.iniciativas', stable: 'politica_id', geo: 'iniciativas.iniciativas_atuacao', fk: 'politica_versao_id' },
  {
    // Vinculadas ao PPPZCM: public.projetos não tem versionamento (rascunhos ficam em *_rascunho); publicado = publicacao.
    // A geometria vem com SRID próprio (4326 ou 4674), então é convertida, não rotulada. Linhas só com nm_regiao (sem geom) ficam de fora.
    categoria: 'zcm',
    main: 'public.projetos',
    stable: 'id',
    geo: 'public.projetos_atuacao',
    fk: 'projeto_id',
    where: 'p.publicacao is not null',
    geom: 'ST_Transform(a.geom, 4326)',
  },
];

const whereOf = src => src.where || DEFAULT_WHERE;
const geomOf = src => src.geom || DEFAULT_GEOM;

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
   * { items: [{ categoria, id, nome, community_id, cd_muns? }], total, porCategoria: { politicas, colegiados, cecsas, projetos, zcm },
   *   municipios: [{ cd_mun, nome, uf }] }
   */
  getPanel(id) {
    return this.cached(id, 'painel', () => this.buildPanel(id));
  }

  /* Geometrias do mapa (território + iniciativas recortadas), também em cache por GT */
  getMap(id) {
    return this.cached(id, 'mapa', () => this.buildMap(id));
  }

  cached(id, kind, build) {
    const key = `${id}:${kind}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;

    const promise = build();
    this.cache.set(key, { at: Date.now(), promise });
    promise.catch(() => this.cache.delete(key)); // não guarda falha
    return promise;
  }

  /* Descarta todos os dados em cache do GT (painel + mapa) */
  invalidate(id) {
    if (id === undefined) return this.cache.clear();
    ['painel', 'mapa'].forEach(kind => this.cache.delete(`${id}:${kind}`));
  }

  async buildPanel(id) {
    const sequelize = db.instance();
    const territorio = `
      with t as (
        select ST_MakeValid(ST_Union(ST_MakeValid(ST_SetSRID(geom, 4326)))) as geom
        from territorial.atuacao
        where iniciativa_id = :id
      )`;

    const porCategoria = { politicas: 0, colegiados: 0, cecsas: 0, projetos: 0, zcm: 0 };
    const items = [];

    for (const src of SOURCES) {
      const rows = await sequelize.query(
        `${territorio}
        select distinct p.${src.stable} as id, p.nome, p.community_id
        from ${src.geo} a
        inner join ${src.main} p on p.id = a.${src.fk} and ${whereOf(src)}
        cross join t
        where t.geom is not null
          and a.geom is not null
          and ST_Intersects(${geomOf(src)}, t.geom)
        order by 1`,
        { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
      );

      porCategoria[src.categoria] = rows.length;
      rows.forEach(r => items.push({ categoria: src.categoria, id: r.id, nome: r.nome, community_id: r.community_id }));
    }

    // Vinculadas ao PPPZCM: as linhas com cd_mun já dizem exatamente quais municípios o projeto atende
    const zcmIds = items.filter(i => i.categoria === 'zcm').map(i => i.id);
    if (zcmIds.length) {
      const links = await sequelize.query(
        `select a.projeto_id as id, array_agg(distinct a.cd_mun order by a.cd_mun) as cd_muns
         from public.projetos_atuacao a
         where a.projeto_id in (:ids) and a.cd_mun is not null
         group by a.projeto_id`,
        { replacements: { ids: zcmIds }, type: Sequelize.QueryTypes.SELECT },
      );
      const byId = new Map(links.map(l => [l.id, l.cd_muns.map(String)]));
      items.forEach(i => {
        if (i.categoria === 'zcm') i.cd_muns = byId.get(i.id) || [];
      });
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

  /*
   * Dados do mapa do painel: contorno do território, bbox e, por iniciativa, a(s) geometria(s) recortada(s) pelo
   * território (somente a parte dentro do recorte), simplificadas. { territorio, bbox, features: [GeoJSON Feature] }
   */
  async buildMap(id) {
    const sequelize = db.instance();
    const territorio = `
      with t as (
        select ST_MakeValid(ST_Union(ST_MakeValid(ST_SetSRID(geom, 4326)))) as geom
        from territorial.atuacao
        where iniciativa_id = :id
      )`;

    const [t] = await sequelize.query(
      `${territorio}
      select ST_AsGeoJSON(ST_Simplify(geom, 0.001))::jsonb as geojson,
             ST_XMin(geom) as x1, ST_YMin(geom) as y1, ST_XMax(geom) as x2, ST_YMax(geom) as y2
      from t where geom is not null`,
      { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
    );

    if (!t) return { territorio: null, bbox: null, features: [] };

    const features = [];

    for (const src of SOURCES) {
      const rows = await sequelize.query(
        `${territorio}
        select s.id,
               -- polígonos muito pequenos somem na simplificação (viram NULL): nesse caso mantém o original
               ST_AsGeoJSON(COALESCE(ST_Simplify(s.g, 0.001), s.g))::jsonb as geojson
        from (
        select p.${src.stable} as id, ST_Collect(d.geom) as g
        from ${src.geo} a
        inner join ${src.main} p on p.id = a.${src.fk} and ${whereOf(src)}
        cross join t
        cross join lateral ST_Dump(ST_Intersection(ST_MakeValid(${geomOf(src)}), t.geom)) d
        where t.geom is not null
          and a.geom is not null
          and ST_Intersects(${geomOf(src)}, t.geom)
          and ST_Dimension(d.geom) <> 1 -- descarta linhas (encostos de divisa); o ST_Dump achata coleções
        group by p.${src.stable}
        ) s`,
        { replacements: { id }, type: Sequelize.QueryTypes.SELECT },
      );

      rows.forEach(r =>
        features.push({ type: 'Feature', properties: { categoria: src.categoria, id: r.id }, geometry: r.geojson }),
      );
    }

    return { territorio: t.geojson, bbox: [[t.y1, t.x1], [t.y2, t.x2]], features };
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
