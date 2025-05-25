const db = require('../database');
const Sequelize = require('sequelize');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');

const helpbox = require('./../helpbox/');
const dayjs = require('dayjs');

class Service {
  /* Entity */
  async list(config) {
    let where = ['c."deletedAt" is NULL', config.type && 'c."type" = :type'].filter(w => w);

    let replacements = {
      limit: config.limit,
      offset: config.offset || (config.page - 1) * config.limit,
      type: config.type,
    };

    const entities = await db.instance().query(
      `
    select
        c.id,
        c."title",
        c.published,
        c.type,
        c.portal,
        c.featured_images,
        c.level,
        h.type as hb_type,
        h.key_ref as hb_key_ref,
        count(*) OVER() AS total_count
    from contents c
    left join helpboxes h on h.content_id = c.id
    ${applyWhere(where)}
    order by ${!config.last ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}, c.title` : 'p."updatedAt" desc'
      }
    ${!config.last && config.order === 'type' ? ', title' : ''}
    LIMIT ${!config.all ? ':limit' : 'NULL'}
    OFFSET ${!config.all ? ':offset' : 'NULL'}
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

  async listFeatured(portal) {
    let where = ['c."deletedAt" is null','c."level" = 1'];

    let replacements = {};

    if(!!portal && portal !== 'main') {
      where.push('portal = :portal');
      replacements.portal = portal;
    }

    const list = await db.instance().query(
      `
      select *
      from contents c
      ${applyWhere(where)}
        `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return list;
  }

  async get(id) {
    const entityModel = await db.models['Content'].findByPk(id);

    let entity = entityModel.toJSON();

    if (entity.categories.length) {
      let categories = await db.models['Content_category'].findAll({
        where: {
          id: { [Sequelize.Op.in]: entity.categories },
        },
      });
      entity.categories = categories.map(({ id, title: name }) => ({ id, name }));
    }

    return entity;
  }

  async getByType(config) {
    let where = ['c."deletedAt" is NULL', 'c.published = true', `c."type" = :type`].filter(w => w);

    let replacements = {
      limit: config.limit,
      offset: config.offset || (config.page - 1) * config.limit,
      type: config.type,
    };

    if (!!config.portal && config.portal !== 'general') {
      where.push('portal = :portal');
      replacements.portal = config.portal;
    }

    const entities = await db.instance().query(
      `
    select
        c.id,
        c."title",
        coalesce(c."intro",'') as "intro",
        c.published,
        c."publishedAt",
        c.featured_images,
        c.portal,
        count(*) OVER() AS total_count
    from contents c
    ${applyWhere(where)}
    order by ${!config.last ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}` : 'p."updatedAt" desc'
      }
    ${!config.last && config.order === 'type' ? ', title' : ''}
    LIMIT ${!config.all ? ':limit' : 'NULL'}
    OFFSET ${!config.all ? ':offset' : 'NULL'}
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

    /* Totals */
    const totals = await db.instance().query(
      `
    select c.portal, count(*)::int as "total"
    from contents c
    where c."deletedAt" is null
    and c.published = true
    and c."type" = :type
    group by c.portal
    `,
      {
        replacements: { type: config.type },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities: preparedEntities,
      pages: !config.all ? pages : 1,
      total,
      hasPrevious,
      hasNext,
      totalsByPortal: totals.reduce((acc, t) => ({ ...acc, [t.portal]: t.total }), {}),
    };
  }

  async getFAQ(portal = 'main') {
    return await db.models['Content'].findAll({
      where: {
        portal,
        type: 'faq',
        published: true,
        deletedAt: null,
      }
    });
  }

  async save(entity, id) {
    entity.categories = entity.categories.map(e => e.id);

    if (entity.published) entity.publishedAt = dayjs().format('YYYY-MM-DD');

    let entityModel;
    if (!id) {
      entityModel = await db.models['Content'].create(entity);
    } else {
      await db.models['Content'].update(entity, {
        where: { id },
      });
      entityModel = await db.models['Content'].findByPk(id);
    }

    entityModel.helpbox = await helpbox.getHelpboxByContentId(entityModel.id);

    if (entityModel.type === 'helpbox' && entity.helpbox) {
      await helpbox.save({
        id: entityModel?.helpbox?.id,
        type: entity.helpbox.type !== 'other' ? entity.helpbox.type : null,
        keyRef: entity.helpbox.keyref,
        contentId: entityModel.id,
      });
    }

    return entity;
  }

  async remove(id) {
    await db.models['Content'].destroy({
      where: {
        id,
      },
    });

    return { success: true };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
