const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');

const removeAccents = require("remove-accents");

class Service {
  async list(config) {
    let where = ["e.entity_type in ('organizacao', 'educom', 'colegiado', 'centro') -- organizations"];
    let replacements = {};

    if (config.filter && !!config.filter.length) {
      where.push('unaccent(e."name") ilike :filter');
      replacements.filter = `%${removeAccents(config.filter)}%`;
    }

    if (config.my_entity_type && ['organizacao', 'educom', 'colegiado', 'centro'].includes(config.my_entity_type)) {
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

  async listEntities(config) {
    let where = ["e.entity_type <> 'organizacao'"];
    let joins = [];
    let replacements = {};

    // TODO: CONFIG -> { filter, my_entity_type, my_entity_id }

    if (config.organizacao) {
      // onde filtro é proponente (type_id = 1) das iniciativas
      joins.push('inner join relations.relations r on r.type_id = 1 and r.from_id = e.id and r.to_id = :organizacao');
      replacements.organizacao = config.organizacao;
    }

    const entities = await db.instance().query(
      `
    select 
      distinct e.id,
      e.name,
      e.entity_type,
      e.entity_id 
    from relations.entities e  
    ${applyJoins(joins)}
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

  async getRelations(entity_type, entity_id) {
    console.log({ entity_type, entity_id })

    return { relations_id: [] }
  }

  async getRelationsOptions(/* TODO: context */) {
    const entities = await db.instance().query(
      `
    select 
      ro.id,
      ro.name
    from relations.relation_options ro
    where id in (7,8,9,10) -- TODO!
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // TODO: order!

    return {
      list: [
        ...entities,
        { id: -1, name: 'Outra' }
      ]
    };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
