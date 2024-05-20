const Sequelize = require('sequelize');
const db = require('../database');


class Service {

  /* v2 */

  async list() {
    const list = await db.instance().query(`
      select i.id, i.nome as "name" 
      from instituicoes i
      order by i.nome
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list }
  }

  async get(id) {
    const entity = await db.models['Institution'].findByPk(id);

    return entity
  }

  async add(entity) {
    const e = await db.models['Institution'].create(entity);

    return e;
  }

  /* .v2 */
}

const singletonInstance = new Service();
module.exports = singletonInstance;