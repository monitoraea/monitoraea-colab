const Sequelize = require('sequelize');
const db = require('../database');
const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');
const removeAccents = require('remove-accents');

class Service {
  async list(config) {
    let where = ['o."deletedAt" is NULL'];

    let replacements = {
      limit: config.limit,
      offset: config.offset || (config.page - 1) * config.limit,
    };

    if (config.filter) {
      where.push(`unaccent(o."nome") ilike '%${removeAccents(config.filter)}%'`); // NOT PROTECTED!!!
    }

    const entities = await db.instance().query(
      `
    select
        o.id,
        o."nome",
        o."legacy",
        count(*) OVER() AS total_count
    from organizacoes o
    ${applyWhere(where)}
    order by ${`"${protect.order(config.order)}" ${protect.direction(config.direction)}, o.nome`}
    LIMIT :limit
    OFFSET :offset
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let preparedEntities = entities;

    /* pages (count), hasPrevious, hasNext */
    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities: preparedEntities,
      pages,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async get(id) {
    return await db.models['Organization'].findByPk(id);
  }

  async getSimilar(id, level) {
    const realLevel = level / 100; // 0.1 - 0.5

    // recupera o produto
    const orgModel = await this.get(id);

    const entities = await db.instance().query(
      `
    with orgs as (
      select o.id, o."nome", unaccent(lower(o."nome")) as "simplerName"
      from organizacoes o
      where o."deletedAt" is NULL
    )
    select o.id, o."nome"
    from orgs o
    where similarity(lower(o."simplerName")::text,unaccent(lower(:name))) > :realLevel
    and o.id <> :id
    order by 2
    `,
      {
        replacements: { id, realLevel, name: orgModel.get('nome') },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entities;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
