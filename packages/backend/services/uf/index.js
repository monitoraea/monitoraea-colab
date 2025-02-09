const db = require('../database');
const Sequelize = require('sequelize');

const { applyJoins, applyWhere, getIds, protect } = require('../../utils');

class Service {
  async listRelated(f_regioes) {
    const sequelize = db.instance();

    let where = '';
    if (f_regioes)
      where = `where u.nm_regiao IN (${f_regioes
        .split(',')
        .map(r => `'${r}'`)
        .join(',')})`;

    const query = `select distinct u.id, u.nm_estado as "label", u.nm_estado as "value", u.nm_regiao as "region"  
        from ufs u
        ${where}
        order by "label"`;

    const ufs = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { list: ufs };
  }

  async getAll(config) {
    const sequelize = db.instance();

    const query = `select distinct u.id, u.nm_estado as "label", CONCAT(u.id,'_',u.cd_geocuf) as "value"
        from ufs u
        order by "label"`;

    const ufs = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    let list = [...ufs];
    if(config.empty) {
      list = [{id: -1, label: 'Não respondido', value: '0_0'}, ...list];
    }

    return { list };
  }

  async get(id) {
    const entities = await db.instance().query(`
    select 
        u.id, 
        u.nm_estado as "name"
    from ufs u
    where u.id = :id
    `, {
      replacements: { id },
      type: Sequelize.QueryTypes.SELECT,
    });

    return entities[0];
  }

  async getRegions() {
    let list = [
      { id: 'CENTRO-OESTE', name: 'CENTRO-OESTE' },
      { id: 'NORDESTE', name: 'NORDESTE' },
      { id: 'NORTE', name: 'NORTE' },
      { id: 'SUDESTE', name: 'SUDESTE' },
      { id: 'SUL', name: 'SUL' },
    ];

    return { list };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
