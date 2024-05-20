const db = require('../database');
const Sequelize = require('sequelize');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');

const helpbox = require('./../helpbox/');
const dayjs = require('dayjs');

class Service {
  /* Entity */
  async list(config) {
    let where = ['f."deletedAt" is NULL'];

    let replacements = {
      limit: config.limit,
    };

    const entities = await db.instance().query(
      `
    select 
        f.*,
        count(*) OVER() AS total_count 
    from facilitators f
    ${applyWhere(where)}
    order by "${protect.order(config.order)}" ${protect.direction(config.direction)}
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
      pages: !config.all ? pages : 1,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async listRandom(limit) {
    let where = ['f."deletedAt" is NULL'];

    

    const entities = await db.instance().query(
      `
      SELECT *
      FROM facilitators f 
      ${applyWhere(where)}
      ORDER BY random()
      LIMIT ${limit}
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let preparedEntities = entities;

    return {
      entities: preparedEntities,
    };
  }

  async listRelated(type) {
    let where = ['c."type" = :type'];

    let replacements = {
      type,
    };

    const list = await db.instance().query(
      `
        SELECT distinct c.id::integer, c.title 
        FROM contents c
        ${applyWhere(where)}
        order by c."title"
        `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { list };
  }

  async get(id) {
    

    const entityModel = await db.models['Facilitator'].findByPk(id);

    let entity = entityModel.toJSON();

    return entity;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;