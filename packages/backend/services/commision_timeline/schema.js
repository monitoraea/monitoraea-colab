module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const CommissionTimeline = sequelize.define(
    'commission_timeline',
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
      schema: 'ciea',
    },
  );

  CommissionTimeline.associate = function (models) {
    CommissionTimeline.belongsTo(models["Commission"], {
      foreignKey: "comissao_id",
    });
    CommissionTimeline.belongsTo(models["File"], {
      foreignKey: "timeline_arquivo",
    });    
  }

  return CommissionTimeline;
};
