module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Comission = sequelize.define(
    'commission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },  
    },
    {
      tableName: 'comissoes',
      paranoid: true,
      schema: 'ciea',
    },
  );

  return Comission;
};
