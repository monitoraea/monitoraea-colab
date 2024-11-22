const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async all() {

    const list = await db.instance().query(`
        select 
          ip.id,
          ip.name,
          ip.link,
          ip.logo
        from instituicoes_portal ip 
        order by ip.order
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
