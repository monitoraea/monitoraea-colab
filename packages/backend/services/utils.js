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
