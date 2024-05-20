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
      from politicas i  
      ${applyWhere(where)}    
      order by i.nome
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list }
  }

  async get(id) {
    const entity = await db.models['Policy'].findByPk(id);

    return entity
  }

  async add(entity) {

    const e = await db.models['Policy'].create(entity);

    return e;
  }

  /* .v2 */
}

const singletonInstance = new Service();
module.exports = singletonInstance;