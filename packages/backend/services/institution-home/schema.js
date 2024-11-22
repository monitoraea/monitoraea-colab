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
      name: {
        field: 'title',
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        field: 'title',
        type: DataTypes.STRING,
      },
      logo: {
        field: 'title',
        type: DataTypes.STRING,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'contents_tags',
      paranoid: true,
    },
  );

  return ContentTag;
};
