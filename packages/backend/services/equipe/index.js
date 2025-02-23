const Sequelize = require('sequelize');
const db = require('../database');
const { applyWhere } = require('../../utils');


class Service {

  async list(config) {
    let where = ['e."deletedAt" is null'];

    const list = await db.instance().query(`      
        select
          e.id,
          e.name,
          e.institution,
          e.photo,
          e.category
        from equipe e
        ${applyWhere(where)}
        order by e.category
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    let prepared_list = {};
    for (let item of list) {
      if (!prepared_list[`cat_${item.category.trim()}`]) {
        prepared_list[`cat_${item.category.trim()}`] = [];
      }
      prepared_list[`cat_${item.category.trim()}`].push(item);
    }

    return { list: prepared_list }
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;