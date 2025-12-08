module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Organization = sequelize.define(
    'organization',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      legacy: {
        type: DataTypes.JSONB,
      },
    },
    {
      tableName: 'organizacoes',
    },
  );

  return Organization;
};
