const db = require('../database');
const Sequelize = require('sequelize');

class Service {
  /* Formações publicadas com seus detalhes (ordenados). A página do portal agrupa e filtra no cliente. */
  async all() {
    const list = await db.instance().query(`
      select
        f.id, f.titulo, f.intro, f.image, f.thumb, f.tipo, f.link,
        f.aberto_inscricao, f."isEAD", f.pinned,
        coalesce((
          select json_agg(json_build_object('id', d.id, 'tipo', d.tipo, 'texto', d.texto, 'ordem', d.ordem) order by d.ordem, d.id)
          from formacoes_detalhes d
          where d.formacoes_id = f.id and d."deletedAt" is null
        ), '[]'::json) as detalhes
      from formacoes f
      where f.published = true and f."deletedAt" is null
      order by f.pinned desc, f."createdAt" desc
    `, { type: Sequelize.QueryTypes.SELECT });

    return { list };
  }
}

module.exports = new Service();
