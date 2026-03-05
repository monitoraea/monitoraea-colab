const db = require("../../database");
const Sequelize = require("sequelize");

const { applyJoins, applyWhere, getIds, defaults, protect } = require('../../util');

class Service {

  async list(config) {
    let where = ['dc."deletedAt" is null'];
    let joins = [`left join ${process.env.DB_PREFIX}community_recipes dcr on dcr."type" = dc."type"`];

    let replacements = {
      limit: config.limit,
      offset: (config.page - 1) * config.limit,
    };

    if (config.type) {
      where.push('dcr.id = :type');
      replacements.type = config.type;
    }

    if (config.search) {
      where.push('dc.descriptor_json->>\'title\' ilike :search');
      replacements.search = `%${config.search}%`;
    }

    let result = await db.instance().query(
      `
      select 
        dc.id, 
        dc.descriptor_json->>'title' as "name", 
        dc.alias, 
        dc."type",
        coalesce(dcr."name",'') as "typeName",

        count(*) OVER() AS total_count

      from ${process.env.DB_PREFIX}communities dc   
      ${applyJoins(joins)}   
      ${applyWhere(where)}  
      order by ${protect.order(config.order)} ${protect.direction(config.direction)}

      LIMIT :limit 
      OFFSET :offset
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements,
      }
    )

    /* pages (count), hasPrevious, hasNext */
    const total = result.length ? parseFloat(result[0]['total_count']) : 0;
    const rawPages = result.length ? parseInt(total) / config.limit : 0;
    let pages = (rawPages === Math.trunc(rawPages)) ? rawPages : (Math.trunc(rawPages) + 1);
    let hasPrevious = (config.page > 1);
    let hasNext = (config.page !== pages);

    return {
        entities: result,
        pages,
        total,
        hasPrevious,
        hasNext,
    };
  }

  async save(entity, recipeType) {
    let result = await db.instance().query(
      `
      select *
      from ${process.env.DB_PREFIX}community_recipes dcr
      where dcr.id = :recipeType
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { recipeType },
      }
    )

    if(!result.length) throw new Error('Recipe not found!');
    
    const recipe = result[0];

    const descriptor = {...recipe.descriptor_json, title: entity.name};

    const rows = await db.instance().query(
      `
      INSERT INTO ${process.env.DB_PREFIX}communities
      (members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type")
      VALUES(false, '', '${JSON.stringify(descriptor)}', NOW(), NOW(), '${recipe.alias}', '${recipe.type}')
      RETURNING id
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    )

    const communityId = rows[0].id;

    return { communityId };
  }

  async delete(id) {
    await db.instance().query(
      `
      update ${process.env.DB_PREFIX}communities
      set "deletedAt" = NOW()
      where id = :id
      `,
      {
        type: Sequelize.QueryTypes.DELETE,
        replacements: { id },
      }
    )

    return { success: true };
  }

  async getTypes(config) {
    let where = ['dcr."deletedAt" is null'];

    if(config.used) where.push(`dcr."type" in (select distinct dc.type from ${process.env.DB_PREFIX}communities dc where dc."deletedAt" is null)`);
    if(config.creatable) where.push(`dcr.creatable = true`);

    let list = await db.instance().query(
      `
      select 
        dcr.id,
        dcr."name"
      from ${process.env.DB_PREFIX}community_recipes dcr
      ${applyWhere(where)}  
      order by dcr."name" 
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    )

    return { list };
  }

  async getType(id) {
    let entity = await db.instance().query(
      `
      select 
        dcr.id,
        dcr."name"
      from ${process.env.DB_PREFIX}community_recipes dcr
      where dcr.id = :type
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { type: id }
      }
    )

    return entity[0];
  }

}


const singletonInstance = new Service();
module.exports = singletonInstance;

