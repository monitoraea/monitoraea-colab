const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async list(others) {
    const sequelize = db.instance();

    const query = `select distinct p.id, p.nome as "label", p.id as "value"
        from tematicas_socioambientais p
        order by "label"`;

    const entities = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    if(others) entities.push({
      "id": others,
      "label": "Outros - especificar",
      "value": others
  })

    return { list: entities };
  }

  async get(id) {
    const entities = await db.instance().query(`
    select 
        p.id, 
        p.nome as "name"
    from tematicas_socioambientais p
    where p.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    return entities.length ? entities[0] : { id, name: 'Outros - especificar' };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
