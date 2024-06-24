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
        c.ativo,
        c.documento_criacao,
        c.documento_criacao_arquivo,
        c.regimento_interno,
        c.regimento_interno_arquivo,
        c.ppea_tem = 1 as ppea_tem,
        c.ppea_decreto,
        c.ppea_lei,
        c.ppea_arquivo,
        c.composicao_cadeiras_set_pub,
        c.composicao_cadeiras_soc_civ,
        c.composicao_cadeiras_outros
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

    let commission = {
      ...entity[0],
      data_criacao: entity[0].data_criacao ? dayjs(`01-01-${entity[0].data_criacao}`, "MM-DD-YYYY") : null,
    };

    for (let document of ['documento_criacao', 'regimento_interno', 'ppea']) {
      if (!!entity[0][`${document}_arquivo`]) {
        const file_entity = await db.instance().query(
          `select f.url, f.content_type from files f where f.id = :file_id`,
          { replacements: { file_id: entity[0][`${document}_arquivo`] }, type: Sequelize.QueryTypes.SELECT }
        );

        if(entity.length) {
          commission[`${document}_arquivo`] = file_entity[0].url;
          commission[`${document}_tipo`] = file_entity[0].content_type === 'text/uri-list' ? 'link' : 'file';
        }
      }
    }

    return commission;
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
