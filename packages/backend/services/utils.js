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

module.exports.getEntities = getEntities = async (from_type, from_id, limit) => {
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
        ${limit ? `LIMIT ${limit}` : ''}
        `,
        {
            replacements: { from_type, from_id },
            type: Sequelize.QueryTypes.SELECT,
        },
    );

    return response;
}
module.exports.getEntity = async (from_type, from_id) => {
    const relations = await getEntities(from_type, from_id, 1);

    return relations.length ? relations[0] : null;
}
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
module.exports.createRelation = async (from_id, to_id, type_id, exclusive /* somente um */) => {
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
        (id, from_id, to_id, type_id, metadata, "createdAt", "updatedAt")
        VALUES(:uuid, :from_id, :to_id, :type_id, '{}'::jsonb, NOW(), NOW());
        `,
        {
            replacements: { uuid: uuidv4(), from_id, to_id, type_id },
            type: Sequelize.QueryTypes.DELETE,
        },
    );
}
module.exports.removeRelation = async (from_id, to_id, type_id) => {
    const specific = to_id ? 'and to_id = :to_id' : ''; // TODO de from_id + type_id OU from_id + type_id + to_id?

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
