module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const IniciativaTimeline = sequelize.define(
    'iniciativa_timeline',
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
      schema: 'iniciativas',
    },
  );

  IniciativaTimeline.associate = function (models) {
    IniciativaTimeline.belongsTo(models['Iniciativa'], {
      foreignKey: 'politica_versao_id',
    });
    IniciativaTimeline.belongsTo(models['File'], {
      foreignKey: 'timeline_arquivo',
    });
  };

  return IniciativaTimeline;
};
