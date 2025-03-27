module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const PPEATimeline = sequelize.define(
    'ppea_timeline',
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
      schema: 'ppea',
    },
  );

  PPEATimeline.associate = function (models) {
    PPEATimeline.belongsTo(models['Ppea'], {
      foreignKey: 'politica_versao_id',
    });
    PPEATimeline.belongsTo(models['File'], {
      foreignKey: 'timeline_arquivo',
    });
  };

  return PPEATimeline;
};
