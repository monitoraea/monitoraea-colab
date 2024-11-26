module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Policy = sequelize.define(
    'policy',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      politica_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },  
    },
    {
      tableName: 'politicas',
      paranoid: true,
      schema: 'ppea',
    },
  );

  return Policy;
};
