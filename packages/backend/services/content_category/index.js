const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async listRelated() {

    const list = await db.instance().query(`
        SELECT distinct c.id::integer, c.title as "name"
        FROM "contents_categories" c
        order by c."title"
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list };
  }

  async get(id) {
    const entities = await db.instance().query(`
    select 
        c.id, 
        c."title" as "name"
    from contents_categories c
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
