const Sequelize = require('sequelize');
const db = require('../database');
const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

/*
 * Território de atuação das iniciativas "guarda-chuva" (schema `territorial`, ver migrations/2.29.1/guarda-chuva.sql).
 * Não há versionamento (draft/current): as geometrias ficam direto em territorial.atuacao.iniciativa_id.
 */
class Service {
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
