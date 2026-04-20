const Sequelize = require("sequelize");
const db = require("./database");
const { v4: uuidv4 } = require('uuid');

const removeAccents = require("remove-accents");

module.exports.compatibilityAnalysis = async (item, field, model) => {
    if (!item[field]) return null;

    const searchElement = removeAccents(item[field].trim()).toLowerCase();

    const table = model.getTableName();
    const query = `SELECT *
        from ${table}
        where TRIM("simplerName") = '${searchElement}'
        limit 1`;

    const elementRow = await db.instance().query(query, {
        type: Sequelize.QueryTypes.SELECT,
    });

    if (elementRow && elementRow.length) return elementRow[0];

    return null;
};

/* AUX RELATIONS */
module.exports.createEntity = async (e_type, e_id, e_name, id, transaction) => {
    const response = await db.instance().query(
        `
        select create_entity(:e_type, :e_id, :e_name ${!!id ? ', :id' : ''})
        `,
        {
            replacements: { e_type, e_id, e_name, id },
            type: Sequelize.QueryTypes.SELECT,
            transaction,
        },
    );

    return response.length ? response[0] : null;
}

module.exports.updateEntity = async (e_type, e_id, e_name, transaction) => {
    const response = await db.instance().query(`select update_entity(:e_type, :e_id, :e_name)`,
        {
            replacements: { e_type, e_id, e_name },
            type: Sequelize.QueryTypes.SELECT,
            transaction,
        },
    );

    return response.length ? response[0] : null;
}

// Retorna ENTIDADES (N=LIMIT) que se relacionam com a ENTIDADE from_id+from_type, pela relação type_id
module.exports.getEntities = getEntities = async (from_type, from_id, type_id = 1, limit) => {
    let perType = type_id === null ? '' : 'and r.type_id = :type_id';

    const response = await db.instance().query(`
        select 
            r.type_id,
            eT.id,
            eT.entity_id, 
            eT."name",
            eT.entity_type 
        from relations.relations r 
        inner join relations.entities eF on eF.id = r.from_id 
        inner join relations.entities eT on eT.id = r.to_id 
        where eF.entity_type = :from_type and eF.entity_id = :from_id
        ${perType}
        ${limit ? `LIMIT ${limit}` : ''}
        `,
        {
            replacements: { from_type, from_id, type_id },
            type: Sequelize.QueryTypes.SELECT,
        },
    );

    return response;
}
// Retorna 1 ENTIDADE que se relacionam com a ENTIDADE from_id+from_type, pela relação type_id
module.exports.getEntity = async (from_type, from_id, type_id = 1) => {
    const relations = await getEntities(from_type, from_id, type_id, 1);

    return relations.length ? relations[0] : null;
}

// Retorna o ID da ENTIDADE que representa a entidade (de perspectiva) em questão
module.exports.getEntityBySpecificId = async (e_type, e_id) => {
    const response = await db.instance().query(
        `
        select e.id
        from relations.entities e
        where e.entity_type = :e_type and e.entity_id = :e_id
        `,
        {
            replacements: { e_type, e_id },
            type: Sequelize.QueryTypes.SELECT,
        },
    );

    return response.length ? response[0].id : null;
}

// cria uma relação entre from_id para to_id do tipo type_id
                                                        
module.exports.createRelation = createRelation = async (from_id, to_id, type_id = null, createdBy = 'from', other_type = null, exclusive /* somente um deste tipo por relação from->to */, as_org = false) => {

    // se uma relação idêntica existe, não faz nada!
    const exists = await db.instance().query(
        `
        select r.id
        from relations.relations r
        where r.from_id = :from_id and r.to_id = :to_id and r.type_id = :type_id
        `,
        {
            replacements: { from_id, to_id, type_id },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
    if (exists.length) return;

    if (exclusive) {
        // se exclusive, remove a relação from_id + type_id existente
        await db.instance().query(
            `
        delete
        from relations.relations
        where from_id = :from_id and type_id = :type_id
        `,
            {
                replacements: { from_id, type_id },
                type: Sequelize.QueryTypes.DELETE,
            },
        );
    }

    // cria a relação
    await db.instance().query(
        `
        INSERT INTO relations.relations
        (id, from_id, to_id, type_id, metadata, "createdBy", other_type, "createdAt", "updatedAt")
        VALUES(:uuid, :from_id, :to_id, :type_id, '{ "as_org": ${as_org ? 'true' : 'false'} }'::jsonb, :createdBy, :other_type, NOW(), NOW());
        `,
        {
            replacements: { uuid: uuidv4(), from_id, to_id, type_id, createdBy, other_type },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}

// remove uma relacao de from_id + to_id (optional) + type_id
module.exports.removeRelation = removeRelation = async (from_id, to_id, type_id) => {
    const specific = to_id ? 'and to_id = :to_id' : '';

    // remove relação
    await db.instance().query(
        `
        DELETE         
        FROM relations.relations
        WHERE from_id = :from_id and type_id = :type_id ${specific}
        `,
        {
            replacements: { from_id, to_id, type_id },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}

// Atualizar uma relação por Id
module.exports.updateRelationById = async (data) => {
    await db.instance().query(
        `
        UPDATE relations.relations
        SET from_id=:from_id, 
            to_id=:to_id, 
            type_id=:type_id, 
            other_type=:other_type, 
            "confirmedByOther"=:confirmedByOther, 
            justification=:justification,
            metadata = jsonb_set(metadata, '{as_org}', ':as_org'::jsonb)
        WHERE id=:relation_id
        `,
        {
            replacements: data,
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}

// Atualizar todas as relacoes do tipo type_id de ENTIDADE e_id (insere ou remove)
module.exports.updateRelations = async (from_id, to_ids /* array of ids */, type_id) => {
    // existing_rels = verifica quais as relacoes existentes do tipo type_id da ENTIDADE e_id
    const existing_rels = await db.instance().query(
        `
        select 
            r.id,
            r.to_id
        from relations.relations r
        where r.from_id = :from_id and r.type_id = :type_id
        `,
        {
            replacements: { from_id, type_id },
            type: Sequelize.QueryTypes.DELETE,
        },
    );

    // 3 opcoes:
    // - já existe: não faz nada
    // - não existe: insere
    // - existia (existe em existing_rels mas não existe em to_id): remove

    const to_add = to_ids.filter(i => !existing_rels.some(e => e.to_id === i.id))
    const to_remove = existing_rels.filter(e => !to_ids.some(i => i.id === e.to_id))

    // console.log('>>>>>>>>>>>>', { to_add , to_remove });
    for (let item of to_add) {
        await createRelation(from_id, item.id, type_id, 'from', null);
    }
    for (let item of to_remove) {
        await removeRelation(from_id, item.to_id, type_id)
    }

}

// remove uma relacao por id
module.exports.removeRelationById = removeRelationById = async (id) => {

    // remove relação
    await db.instance().query(
        `
        DELETE         
        FROM relations.relations
        WHERE id = :id
        `,
        {
            replacements: { id },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}

// atualizar uma indicacao por id
module.exports.updateReferenceById = updateReferenceById = async (id, confirmedByOther, justification) => {
    let confirmedByOtherBool;
    switch (confirmedByOther) {
        case 'yes':
            confirmedByOtherBool = true;
            break;
        case 'no':
            confirmedByOtherBool = false;
            break;
        default:
            confirmedByOtherBool = null;
    }


    await db.instance().query(
        `
        UPDATE relations.relations
        SET "confirmedByOther" = :confirmedByOther,
            justification = :justification
        WHERE id = :id
        `,
        {
            replacements: { id, confirmedByOther: confirmedByOtherBool, justification },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}

// atualiza perguntas base
module.exports.updateBase = async (entity_type, entity_id, type, value) => {
    await db.instance().query(
        `
        UPDATE relations.entities
        SET relations_${type}_it_base = :value
        WHERE entity_type = :entity_type
        AND entity_id = :entity_id
        `,
        {
            replacements: { entity_type, entity_id, value },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}