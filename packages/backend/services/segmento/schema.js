module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Segment = sequelize.define(
    'segment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        field: 'nome',
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {      
      tableName: 'segmentos',
      timestamps: false,
    },
  );

  return Segment;
};
