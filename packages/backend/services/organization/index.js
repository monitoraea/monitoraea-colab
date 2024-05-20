const Sequelize = require('sequelize');
const db = require('../database');
const { applyWhere } = require('../../utils');


class Service {

  /* v2 */

  async list(avoid) {
    let where  = [];
    if(avoid.length) where.push(`i.id not in (${avoid.join(',')})`);

    const list = await db.instance().query(`
      select i.id, i.nome as "name" 
      from organizacoes i  
      ${applyWhere(where)}    
      order by i.nome
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list }
  }

  async get(id) {
    const entity = await db.models['Organization'].findByPk(id);

    return entity
  }

  async add(entity) {

    entity.segmentos = entity.segmentos?.map(s => s.id);

    const e = await db.models['Organization'].create(entity);

    return e;
  }

  /* .v2 */
}

const singletonInstance = new Service();
module.exports = singletonInstance;