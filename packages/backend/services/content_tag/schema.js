module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const ContentTag = sequelize.define(
    'content_tag',
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
      tableName: 'contents_tags',
      paranoid: true,
    },
  );

  return ContentTag;
};
