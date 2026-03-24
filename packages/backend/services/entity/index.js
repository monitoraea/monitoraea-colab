const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');

const removeAccents = require("remove-accents");

class Service {
  async list(config) {
    let where = ["e.entity_type in ('organizacao', 'educom', 'colegiado') -- organizations"];
    let replacements = {};

    if(config.filter && !!config.filter.length) {
      where.push('unaccent(e."name") ilike :filter');
      replacements.filter = `%${removeAccents(config.filter)}%`;
    }

    if (config.my_entity_type && ['organizacao', 'educom', 'colegiado'].includes(config.my_entity_type)) {
      where.push('(e.entity_type <> :e_type or e.entity_id <> :e_id)-- filters for organizations itselves');
      replacements.e_type = config.my_entity_type;
      replacements.e_id = config.my_entity_id;
    }

    const entities = await db.instance().query(
      `
    select 
      e.id,
      e.name,
      e.entity_type,
      e.entity_id 
    from relations.entities e 
    ${applyWhere(where)}
    order by e."name"
    LIMIT 200 
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { list: entities };

  }

  async get(id) {
    
    const entities = await db.instance().query(
      `
      select  
        e.id,
        e.name,
        e.entity_type,
        e.entity_id 
      from relations.entities e
      where id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return !entities.length ? null : entities[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
