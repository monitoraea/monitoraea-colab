const db = require('../database');
const Sequelize = require('sequelize');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');

class Service {
  async getAllNews(config) {
    let where = ['c."deletedAt" is NULL', 'c.published = true', `c."type" = 'news'`, `portal = 'pppzcm'`].filter(w => w);

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
        c.featured_images,
        count(*) OVER() AS total_count 
    from contents c
    ${applyWhere(where)}
    group by c.id, c.title
    order by ${
      !config.last ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}` : 'p."updatedAt" desc'
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

  async getTotal() {
    const sequelize = db.instance();

    const [{ total }] = await sequelize.query(
      `SELECT count(*)::int as total 
       FROM contents c 
       WHERE c."type" = 'news' 
        AND c."deletedAt" is null 
        AND c.published is not null`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { total };
  }

  async save(id, title, image_url, category, body, image_alt_text, big_image_url) {
    await db.instance().query(
      ` 
        insert into news(title, image_url, category, body, image_alt_text,big_image_url)
        values( :title, :image_url, :category,:body, :image_alt_text,:big_image_url)
        `,
      {
        replacements: { id, title, image_url, category, body, image_alt_text, big_image_url },
        type: Sequelize.QueryTypes.INSERT,
      },
    );
  }

  async getNewsById(newsId) {
    const sequelize = db.instance();

    const news = await sequelize.query(
      ` 
      SELECT 
        id, 
        image_url,
        big_image_url, 
        title, 
        publish_date, 
        category, 
        body, 
        image_alt_text
      FROM news 
      WHERE id = :id`,
      {
        replacements: { id: newsId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return news[0];
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
