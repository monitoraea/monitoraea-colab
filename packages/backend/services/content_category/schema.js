module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const ContentCategory = sequelize.define(
    'content_category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        field: 'title',
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'contents_categories',
      paranoid: true,
    },
  );

  return ContentCategory;
};
