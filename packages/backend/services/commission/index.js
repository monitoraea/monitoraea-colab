const db = require('../database');
const Sequelize = require('sequelize');

const { /* applyJoins ,*/ applyWhere, /* getIds ,*/ protect } = require('../../utils');

const dayjs = require('dayjs');

class Service {
  /* Entity */
  async get(id) {
    const entity = await db.instance().query(
      `
      SELECT
        u.nm_estado,
        u.nm_regiao,
        c.link,
        c.data_criacao,
        c.documento_criacao,
        (select f.url from files f where f.id = c.documento_criacao_arquivo) as documento_criacao_arquivo,
        c.regimento_interno,
        (select f.url from files f where f.id = c.regimento_interno_arquivo) as regimento_interno_arquivo,
        c.ppea_tem = 1 as ppea_tem,
        c.ppea_decreto,
        c.ppea_lei,
        (select f.url from files f where f.id = c.ppea_arquivo) as ppea_arquivo
      FROM ciea.comissoes c
      inner join ufs u on u.id = c.uf
      WHERE c.id = :id
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }


  async getDraft(id) {
    const entity = await db.instance().query(
      `
      SELECT
        c.uf,
        u.nm_estado as uf_nome,        
        u.nm_regiao as regiao,
        c.link,
        c.data_criacao,
        c.documento_criacao,
        (select f.url from files f where f.id = c.documento_criacao_arquivo) as documento_criacao_arquivo,
        c.regimento_interno,
        (select f.url from files f where f.id = c.regimento_interno_arquivo) as regimento_interno_arquivo,
        c.ppea_tem = 1 as ppea_tem,
        c.ppea_decreto,
        c.ppea_lei,
        (select f.url from files f where f.id = c.ppea_arquivo) as ppea_arquivo
      FROM ciea.comissoes c
      inner join ufs u on u.id = c.uf
      WHERE c.id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  c.id
        from ciea.comissoes c
        where c.community_id = :community_id`,
      {
        replacements: { community_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    const id = result[0].id;

    return { id };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
