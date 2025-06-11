module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Educom_Clima_Timeline = sequelize.define(
    'educom_clima_timeline',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: DataTypes.DATE,
      },
      texto: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'linhas_do_tempo',
      schema: 'educom_clima',
    },
  );

  Educom_Clima_Timeline.associate = function (models) {
    Educom_Clima_Timeline.belongsTo(models['File'], {
      foreignKey: 'timeline_arquivo',
    });
  };

  return Educom_Clima_Timeline;
};
