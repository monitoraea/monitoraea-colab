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
        * -- TODO
      FROM ppea.politicas p
      WHERE p.id = :id
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }

  async getDraftInfo(id) {
    const entity = await db.instance().query(
      `
      SELECT
        p.nome,
        p.area,
        p.area_tematica,
        p.link,
        instituicao_nome,
        instituicao_enquadramento,
        responsavel_nome,
        responsavel_cargo,
        responsavel_telefone,
        responsavel_email,
        fase,
        fase_ano,
        fase_descricao,
        dificuldades,
        contemplados
      FROM ppea.politicas p
      WHERE p.id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let policy = entity[0];

    return policy;
  }

  async getDraftIndic(id) {
    const entity = await db.instance().query(
      `
      SELECT
        indicadores
      FROM ppea.politicas p
      WHERE p.id = :id
      AND versao = 'draft'
        `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let policy = entity[0];

    return policy;
  }

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  c.id
        from ppea.politicas c
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
