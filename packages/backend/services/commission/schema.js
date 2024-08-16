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
      ativo: {
        type: DataTypes.INTEGER,
      },
      data_criacao: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'comissoes',
      paranoid: true,
      schema: 'ciea',
    },
  );

  Comission.associate = function (models) {
    Comission.belongsTo(models["File"], {
      foreignKey: "logo_arquivo",
    });
    Comission.belongsTo(models["File"], {
      foreignKey: "documento_criacao_arquivo",
    });
  }

  return Comission;
};
