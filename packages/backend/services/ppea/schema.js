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
    },
    {
      tableName: 'politicas',
      paranoid: true,
      schema: 'ppea',
    },
  );

  return Policy;
};
