module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Project = sequelize.define(
    'project',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    {
      tableName: 'projetos',
      timestamps: false,
    },
  );

  return Project;
};
