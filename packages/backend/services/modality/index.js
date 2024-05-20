const Sequelize = require('sequelize');
const db = require('../database');


class Service {

  /* v2 */

  async list() {
    const list = await db.instance().query(`
      select i.id, i.nome as "name", i.id::int as "value"
      from modalidades i
      order by i.nome
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list }
  }

  async get(id) {
    const entity = await db.models['Modality'].findByPk(id);

    return entity
  }

  /* .v2 */
}

const singletonInstance = new Service();
module.exports = singletonInstance;