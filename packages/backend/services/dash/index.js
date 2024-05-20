const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');

class Service {
  async getHomeStatistics() {
    const sequelize = db.instance();

    const [{ total: qtdProjetos }] = await sequelize.query(
      `select count(*)::int as total from projetos p`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const modalidades = await sequelize.query(
      `
            select m.id, UPPER(m.nome) as nome, count(*)::int as total
            from projetos p 
            inner join modalidades m on m.id = p.modalidade_id
            group by m.id, m.nome
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const regioes = await sequelize.query(
      `
            select pa.nm_regiao as nome, count(distinct p.id)::int as total
            from projetos p 
            inner join projetos_atuacao pa on pa.projeto_id = p.id
            where nm_regiao is not null
            group by pa.nm_regiao
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      qtdProjetos,
      modalidades,
      regioes,
    };
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
