const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async all() {

    const list = await db.instance().query(`
        select 
          nm.id,
          nm.text,
          nm.thumb,
          nm."publishedAt"
        from na_midia nm 
        order by nm."publishedAt" DESC
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
