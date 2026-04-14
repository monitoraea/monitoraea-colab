const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');
const { removeRelationById, updateReferenceById, updateBase, createEntity, updateRelationById } = require('../utils');

const removeAccents = require("remove-accents");
const { Organizations } = require('aws-sdk');

class Service {
  async list(config) {
    let where = ["e.entity_type in ('organizacao', 'educom', 'colegiado', 'centro') -- organizations"];
    let replacements = {};

    if (config.filter && !!config.filter.length) {
      where.push('unaccent(e."name") ilike :filter');
      replacements.filter = `%${removeAccents(config.filter)}%`;
    }

    if (config.my_entity_type && ['organizacao', 'educom', 'colegiado', 'centro'].includes(config.my_entity_type)) {
      where.push('(e.entity_type <> :e_type or e.entity_id <> :e_id)-- filters for organizations itselves');
      replacements.e_type = config.my_entity_type;
      replacements.e_id = config.my_entity_id;
    }

    const entities = await db.instance().query(
      `
    select 
      e.id,
      e.name,
      e.entity_type,
      e.entity_id 
    from relations.entities e 
    ${applyWhere(where)}
    order by e."name"
    LIMIT 200 
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { list: entities };

  }

  async listEntities(config) {
    let where = ["e.entity_type <> 'organizacao'"];
    let joins = [];
    let replacements = {};

    if (config.filter && !!config.filter.length) {
      where.push('unaccent(e."name") ilike :filter');
      replacements.filter = `%${removeAccents(config.filter)}%`;
    }

    if (config.organizacao) {
      // onde filtro é proponente (type_id = 1) das iniciativas
      joins.push('inner join relations.relations r on r.type_id = 1 and r.from_id = e.id and r.to_id = :organizacao');
      replacements.organizacao = config.organizacao;
    }

    if (config.my_entity_type) {
      where.push('(e.entity_type <> :e_type or e.entity_id <> :e_id)-- filter itself');
      replacements.e_type = config.my_entity_type;
      replacements.e_id = config.my_entity_id;
    }

    const entities = await db.instance().query(
      `
    select 
      distinct e.id,
      e.name,
      e.entity_type,
      e.entity_id 
    from relations.entities e  
    ${applyJoins(joins)}
    ${applyWhere(where)} 
    order by e."name"
    LIMIT 200 
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { list: entities };
  }

  async get(id) {

    const entities = await db.instance().query(
      `
      select  
        e.id,
        e.name,
        e.entity_type,
        e.entity_id 
      from relations.entities e
      where id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return !entities.length ? null : entities[0];
  }

  async getRelationsOptions(/* TODO: context */) {
    const entities = await db.instance().query(
      `
    select 
      ro.id,
      ro.name
    from relations.relation_options ro
    where id in (7,8,9,10) -- TODO!
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // TODO: order!

    return {
      list: [
        ...entities,
        { id: -1, name: 'Outra' }
      ]
    };
  }

  async getRelationOptions(id) {
    if (id == '-1') return { id: -1, name: 'Outra' };

    const entities = await db.instance().query(
      `
      select 
        ro.id,
        ro.name
      from relations.relation_options ro
      where ro.id = :id
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id }
      },
    );

    return entities?.[0] || null;
  }

  async save(id, entity) {
    if (id != entity.my_entity_id) {
      console.log(id, entity.my_entity_id)
      throw 'Wrong entity ID';
    }

    const original_relations = await this.getRelations(entity.my_entity_type, entity.my_entity_id);

    // console.log(JSON.stringify(original_relations))
    // console.log('\n\n');

    // remove relações em blocos não de entity
    if (!entity.relations_recebe_it_base) entity.relations_recebe_it = [];
    if (!entity.relations_oferece_it_base) entity.relations_oferece_it = [];
    // limpa relações sem organizacao E iniciativa
    entity.relations_recebe_it = entity.relations_recebe_it.filter(r => r.organizacao_r || r.iniciativa_r);
    entity.relations_oferece_it = entity.relations_oferece_it.filter(r => r.organizacao_o || r.iniciativa_o);

    let organizations_to_create = [];
    let initiatives_to_create = [];
    let other_relations_to_create = [];
    const plan = this.planAction(original_relations, entity, organizations_to_create, initiatives_to_create, other_relations_to_create);

    // console.log(JSON.stringify(entity))

    // Executar PLAN
    console.log(JSON.stringify({
      creator_id: original_relations.id,
      organizations_to_create,
      initiatives_to_create,
      other_relations_to_create,
      plan,
    }))

    // organizations_to_create
    for (let i of organizations_to_create) await createEntity('organizacao', null, i.name, i.id);

    // initiatives_to_create
    for (let i of initiatives_to_create) await createEntity('iniciativa', null, i.initiative.name, i.initiative.id);

    // other_relations_to_create
    for (let i of other_relations_to_create) await createRelation(/* FROM */ i.iniciativa.id, /* TO */ i.organizacao.id, /* PROPONENCIA */ 1);

    for (let type of ['recebe', 'oferece']) {
      const complement = `_${type === 'recebe' ? 'r' : 'o'}`;

      // atualiza perguntas base (se mudou)
      if (plan[type].base !== null) {
        await updateBase(entity.my_entity_type, entity.my_entity_id, type, plan[type].base);
      }

      // remover
      for (let rId of plan[type].to_remove) await removeRelationById(rId);

      // atualizar indicacoes      
      for (let { id, confirmedByOther, justification } of plan[`indicacao_relations_${type}_it`]) await updateReferenceById(id, confirmedByOther, justification);

      // adicionar
      for (let e of plan[type].to_add) {

        const outroId = e[`iniciativa${complement}`]?.id || e[`organizacao${complement}`]?.id;
        const from_id = type === 'recebe' ? outroId : original_relations.id;
        const to_id = type === 'recebe' ? original_relations.id : outroId;
        const type_id = e[`tipo_relacao${complement}`]?.id;
        const createdBy = type === 'recebe' ? 'to' : 'from';
        const other_type = e[`outra_relacao${complement}`];

        await createRelation(from_id, to_id, type_id, createdBy, other_type);
      }

      // atualizar
      for (let e of plan[type].to_update) {

        const outroId = e[`iniciativa${complement}`]?.id || e[`organizacao${complement}`]?.id;

        await updateRelationById({
          relation_id: e.id,
          from_id: type === 'recebe' ? outroId : original_relations.id,
          to_id: type === 'recebe' ? original_relations.id : outroId,
          type_id: e[`tipo_relacao${complement}`]?.id,
          other_type: e[`outra_relacao${complement}`],
          confirmedByOther: e.confirmedByOther,
          justification: e.justification,
        });
      }
    }

    return true;
  }

  async getRelations(entity_type, entity_id) {
    // This entity is FROM (oferece) or TO (recebe)
    // se há relação de proponencia para uma iniciativa, trazer a organização

    // ENTIDADE
    const entities = await db.instance().query(`
    select 
      e.id, 
      e.relations_recebe_it_base, 
      e.relations_oferece_it_base
    from relations.entities e 
    where 
      e.entity_id = :entity_id
    and 
      e.entity_type = :entity_type
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { entity_type, entity_id }
      },
    );

    const entity = entities[0];

    // RECEBEoriginal_relations.id
    const recebe = await db.instance().query(
      `
        SELECT 
          r.id,
          r.from_id as other_id,
          r.type_id,
          r.other_type,
          r."createdBy" = 'to' as mine,
          r."confirmedByOther",
          r.justification,
          (select jsonb_build_object('id',ee.id,'name',ee.name) from relations.entities ee inner join relations.relations rr on rr.to_id = ee.id and rr.type_id = 1 and rr.from_id = r.from_id limit 1) as proponente,
	        ef."name" other_name,
	        ef.entity_type other_participant_type,
	      ro."name" as relacao_name 
        from relations.relations r
        left join relations.entities ef on ef.id = r.from_id
        left join relations.relation_options ro on ro.id = r.type_id 
        where r.to_id = :id
        and (r.type_id in (-1,7,8,9,10) or r.type_id is null) 
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id: entity.id }
      },
    );

    // OFERECE
    const oferece = await db.instance().query(
      `
        SELECT 
          r.id,
          r.to_id as other_id,
          r.type_id,
          r.other_type,
          r."createdBy" = 'from' as mine,
          r."confirmedByOther",
          r.justification,
          (select jsonb_build_object('id',ee.id,'name',ee.name) from relations.entities ee inner join relations.relations rr on rr.to_id = ee.id and rr.type_id = 1 and rr.from_id = r.to_id limit 1) as proponente,	
          et."name" other_name,
          et.entity_type other_participant_type,
          ro."name" as relacao_name
        from relations.relations r
        left join relations.entities et on et.id = r.to_id 
        left join relations.relation_options ro on ro.id = r.type_id  
        where r.from_id = :id
        and (r.type_id in (-1,7,8,9,10) or r.type_id is null) 
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id: entity.id }
      },
    );

    let relations_recebe_it = entity.relations_recebe_it_base ? recebe.filter(r => r.mine).map(r => {
      const outro = this.analisaOutro(r);

      return {
        id: r.id,
        organizacao_r: { id: outro.organizacao_id },
        iniciativa_r: { id: outro.iniciativa_id },
        tipo_relacao_r: { id: r.type_id },
        outra_relacao_r: r.other_type,
        confirmedByOther_r: this.cboValue(r.confirmedByOther),
        justification_r: r.justification || '',
      }
    }) : [];


    let relations_oferece_it = entity.relations_oferece_it_base ? oferece.filter(r => r.mine).map(r => {
      const outro = this.analisaOutro(r);

      return {
        id: r.id,
        organizacao_o: { id: outro.organizacao_id },
        iniciativa_o: { id: outro.iniciativa_id },
        tipo_relacao_o: { id: r.type_id },
        outra_relacao_o: r.other_type,
        confirmedByOther_o: this.cboValue(r.confirmedByOther),
        justification_o: r.justification || '',
      }
    }) : [];

    let indicacao_relations_recebe_it = recebe.filter(r => !r.mine).map(r => {
      const outro = this.analisaOutro(r);

      return {
        id: r.id,
        organizacao: { id: outro.organizacao_id },
        other_organizacao_name: outro.organizacao_name,
        iniciativa: { id: outro.iniciativa_id },
        other_iniciativa_name: outro.iniciativa_name,
        tipo_relacao: { id: r.type_id },
        relacao_name: r.relacao_name || r.other_type,
        mine: r.mine,
        confirmedByOther: this.cboValue(r.confirmedByOther),
        justification: r.justification || '',
      }
    });


    let indicacao_relations_oferece_it = oferece.filter(r => !r.mine).map(r => {
      const outro = this.analisaOutro(r);

      return {
        id: r.id,
        organizacao: { id: outro.organizacao_id },
        other_organizacao_name: outro.organizacao_name,
        iniciativa: { id: outro.iniciativa_id },
        other_iniciativa_name: outro.iniciativa_name,
        tipo_relacao: { id: r.type_id },
        relacao_name: r.relacao_name || r.other_type,
        mine: r.mine,
        confirmedByOther: this.cboValue(r.confirmedByOther),
        justification: r.justification || '',
      }
    });

    return {
      id: entity.id,
      relations_recebe_it_base: entity.relations_recebe_it_base,
      relations_recebe_it,
      relations_oferece_it_base: entity.relations_oferece_it_base,
      relations_oferece_it,
      indicacao_relations_recebe_it,
      indicacao_relations_oferece_it,
    }
  }

  analisaOutro(r) {
    /* Determina se o outro é uma organização ou uma iniciativa e */
    /* Popula o objeto com os dados corretos provenientes de R */

    let organizacao_id = null;
    let organizacao_name = null;
    let iniciativa_id = null;
    let iniciativa_name = null;

    if (r.other_participant_type === 'organizacao') {
      organizacao_id = r.other_id;
      organizacao_name = r.other_name;
    } else {
      if(r.proponente) {
        organizacao_id = r.proponente.id;
        organizacao_name = r.proponente.name;
      }

      iniciativa_id = r.other_id;
      iniciativa_name = r.other_name;
    }

    return {
      organizacao_id,
      organizacao_name,
      iniciativa_id,
      iniciativa_name,
    }
  }

  planAction(original, updated, organizations_to_create, initiatives_to_create, other_relations_to_create) {
    // recebe    
    // oferece
    // indicacao_relations_recebe_it (somente atualizacao)
    // indicacao_relations_oferece_it (somente atualizacao)

    return {
      recebe: this.planActionType('recebe', original, updated, organizations_to_create, initiatives_to_create, other_relations_to_create),
      oferece: this.planActionType('oferece', original, updated, organizations_to_create, initiatives_to_create, other_relations_to_create),
      indicacao_relations_recebe_it: this.planActionIndicacaoType('recebe', original, updated),
      indicacao_relations_oferece_it: this.planActionIndicacaoType('oferece', original, updated),
    }
  }
  planActionType(type, original, updated, organizations_to_create, initiatives_to_create, other_relations_to_create) {
    const typeKey = `relations_${type}_it`;
    const complement = `_${type === 'recebe' ? 'r' : 'o'}`;

    const to_add = updated[typeKey].filter(i => !original[typeKey].some(e => e.id === i.id))
    const to_remove = original[typeKey].filter(e => !updated[typeKey].some(i => i.id === e.id)).map(e => e.id)
    let to_update = [];

    for (let o of original[typeKey]) for (let u of updated[typeKey]) {
      if (u.id !== o.id) continue; // foi encontrado nos originais, segue abaixo

      if (!this.isSameRelation(type, u, o)) to_update.push({
        ...u,
        confirmedByOther: null, // se uma INDICACAO é atualizada, sua resposta de "confirmedByOther" e "justification" devem ser resetadas
        justification: '', // idem
      }); // tem alteração, registra para atualização
    }

    // em to_add e to_update pode haver criacoes
    for (let e of [...to_add, ...to_update]) {
      // console.log({ e })

      if (!!e[`organizacao${complement}`]?.name) { // se org tem name -> create              
        const found = organizations_to_create.find(i => i.name.trim() === e[`organizacao${complement}`]?.name.trim());
        if (found) {
          // se já vai criar uma org com este name (trim), não cria nova, mas altera o id da org deste item
          e[`organizacao${complement}`] = found;
        } else organizations_to_create.push(e[`organizacao${complement}`]); // se nao, inclui
      }
      if (!!e[`iniciativa${complement}`]?.name) { // se ini tem name -> create      
        const found = initiatives_to_create.find(i => i.initiative.name.trim() === e[`iniciativa${complement}`]?.name.trim() && // mesmo nome
          i.organization?.id === e[`organizacao${complement}`]?.id // mesma org
        );
        if (found) {
          // se já vai criar uma iniciativa com este name (trim) que aponta para a mesma org (id ou null), não cria nova, mas altera o id da org deste item
          e[`iniciativa${complement}`] = found;
        } else {
          // se aponta para org, cria relacao (to_add com proponencia)
          if (!!e[`organizacao${complement}`]?.id) {
            other_relations_to_create.push({
              organizacao: {
                "id": e[`organizacao${complement}`].id
              },
              iniciativa: {
                "id": e[`iniciativa${complement}`].id
              },
              tipo_relacao: 1,
            })
          }
          initiatives_to_create.push({ initiative: e[`iniciativa${complement}`], organization: e[`organizacao${complement}`] }); // se nao, inclui
        }
      }
    }

    return {
      base: updated[`relations_${type}_it_base`] !== original[`relations_${type}_it_base`] ? updated[`relations_${type}_it_base`] : null,
      to_add,
      to_remove,
      to_update,
    }
  }
  planActionIndicacaoType(type, original, updated) {
    const typeKey = `indicacao_relations_${type}_it`;
    let to_update = [];

    // somente confirmedByOther e justification
    for (let o of original[typeKey]) {
      const u = updated[typeKey].find(i => i.id === o.id);
      if (u && (u.confirmedByOther !== o.confirmedByOther || u.justification !== o.justification)) to_update.push(u);
    }

    return to_update;
  }
  isSameRelation(type, u, o) {
    const complement = `_${type === 'recebe' ? 'r' : 'o'}`;

    if (u[`iniciativa${complement}`]?.id !== o[`iniciativa${complement}`]?.id) return false;
    if (u[`organizacao${complement}`]?.id !== o[`organizacao${complement}`]?.id) return false;
    if (u[`tipo_relacao${complement}`]?.id !== o[`tipo_relacao${complement}`]?.id) return false;
    if (u[`outra_relacao${complement}`] !== o[`outra_relacao${complement}`]) return false;

    return true;
  }

  cboValue(value) {
    if (value === null) return '';
    return !!value ? 'yes' : 'no';
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
