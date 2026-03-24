const Sequelize = require("sequelize");
const db = require("./database");

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

module.exports.createEntity = async (e_type, e_id, e_name, transaction) => {
    const response = await db.instance().query(`select create_entity(:e_type, :e_id, :e_name)`,
        {
            replacements: { e_type, e_id, e_name },
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
