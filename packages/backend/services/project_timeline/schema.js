module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const ProjectTimeline = sequelize.define(
    'project_timeline',
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
    },
  );

  ProjectTimeline.associate = function (models) {
    ProjectTimeline.belongsTo(models['Project'], {
      foreignKey: 'projeto_id',
    });
    ProjectTimeline.belongsTo(models['File'], {
      foreignKey: 'timeline_arquivo',
    });
  };

  return ProjectTimeline;
};
