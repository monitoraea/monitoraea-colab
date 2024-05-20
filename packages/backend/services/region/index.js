const Sequelize = require('sequelize');
const db = require('../database');


class Service {

  /* v2 */

  async list() {
    const { list } = await require('../project').getAllRegions();

    return { list: list.map(l => ({ id: l.id, name: l.value, value: l.value })).sort((a,b) => a.name < b.name ? -1 : 1) }
  }

  async get(id) {
    const { list } = await require('../project').getAllRegions();

    const item = list.find(i => String(i.id) === String(id));

    return {...item, name: item.value }
  }

  /* .v2 */
}

const singletonInstance = new Service();
module.exports = singletonInstance;