const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async list() {
    const sequelize = db.instance();

    const query = `select distinct p.id, p.nome as "label", p.id as "value"
        from areas_interesse p
        order by "label"`;

    const entities = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list: entities };
  }

  async listRelated() {
    const query = `select distinct p.id, p.nome as "name"
        from areas_interesse p
        order by "name"`;

    const entities = await db.instance().query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list: entities };
  }

  async get(id) {
    const entities = await db.instance().query(
      `
    select
        p.id,
        p.nome as "name"
    from areas_interesse p
    where p.id = :id
    `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entities[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
