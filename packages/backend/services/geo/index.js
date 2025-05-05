const Sequelize = require('sequelize');
const db = require('../database');

const { Messagery } = require('dorothy-dna-services');

const { applyJoins, applyWhere, protect } = require('../../utils');

class Service {

  async getGeojson(entity, key, id) {

    const geoms = await db.instance().query(
      `
    select (ST_AsGeoJSON(ST_Transform(e.geom,4326)))::jsonb as geojson
    from ${entity} e 
    where e.${key} = :id 
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id }
      },
    );

    return {
      geoms: geoms.map(({ geojson }) => geojson),
    };

  }

}

const singletonInstance = new Service();
module.exports = singletonInstance;
