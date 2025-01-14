module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const CNETimeline = sequelize.define(
    'cne_timeline',
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
      schema: 'cne',
    },
  );

  CNETimeline.associate = function (models) {
    CNETimeline.belongsTo(models["Cne"], {
      foreignKey: "cne_versao_id",
    });
    CNETimeline.belongsTo(models["File"], {
      foreignKey: "timeline_arquivo",
    });    
  }

  return CNETimeline;
};
