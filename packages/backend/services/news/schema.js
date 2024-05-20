module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const News = sequelize.define(
    'news',
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
      image_url: {
        field: 'image_url',
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        field: 'category',
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        field: 'body',
        type: DataTypes.STRING,
        allowNull: false,
      },
      image_alt_text: {
        field: 'image_alt_text',
        type: DataTypes.STRING,
        allowNull: false,
      },
      big_image_url: {
        field: 'big_image_url',
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'news',
      timestamps: false,
    },
  );

  return News;
};
