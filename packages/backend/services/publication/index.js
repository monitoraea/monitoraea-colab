const Sequelize = require('sequelize');
const db = require('../database');
const { applyWhere } = require('../../utils');


class Service {

  async list(config) {
    let where = ['p."deletedAt" is null'];
    let replacements = {};

    if (config.tipo) {
      where.push('p.tipo_id = :tipo');
      replacements.tipo = config.tipo;
    }
    if (config.ano) {
      where.push('p.year = :ano');
      replacements.ano = config.ano;
    }
    if (config.titulo) {
      where.push(`unaccent(p.name) ilike unaccent(:titulo)`);
      replacements.titulo = `%${config.titulo}%`;
    }

    const list = await db.instance().query(`
      select 
        p.id,
        p.year,
        pt."name" as "tipo",
        p."name",
        p.link,
        p.categoria_id
      from publicacoes p
      inner join publicacoes_tipos pt on pt.id = p.tipo_id
      ${applyWhere(where)}
      order by p.categoria_id, p."year" desc
        `, {
      type: Sequelize.QueryTypes.SELECT,
      replacements,
    });

    let prepared_list = {};
    for (let item of list) {
      if (!prepared_list[`cat_${item.categoria_id}`]) {
        prepared_list[`cat_${item.categoria_id}`] = [];
      }
      prepared_list[`cat_${item.categoria_id}`].push(item);
    }

    return { list: prepared_list }
  }

  async listTipos() {
    const list = await db.instance().query(`
      select 
        pt.id as "value",
        pt.name as "label"
      from publicacoes_tipos pt
      order by pt."name"
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return list
  }

  async listAnos() {
    const list = await db.instance().query(`
      select 
        distinct p.year as "value",
        p.year as "label"
      from publicacoes p
      where p.year is not null
      order by p."year"
        `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return list
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;