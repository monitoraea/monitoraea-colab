const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async listRelated() {

    const list = await db.instance().query(`
        SELECT distinct c.id::integer, c.nome as "name"
        FROM "segmentos" c
        order by c."nome"
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list };
  }

  async get(id) {
    const entities = await db.instance().query(`
    select 
        c.id, 
        c."nome" as "name"
    from segmentos c
    where c.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    return entities[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
