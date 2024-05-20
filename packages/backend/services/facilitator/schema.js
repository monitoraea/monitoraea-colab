module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Facilitator = sequelize.define(
    'facilitator',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    {
      tableName: 'facilitators',
      paranoid: true,
    },
  );

  return Facilitator;
};
