module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Commission = sequelize.define(
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
      link: {
        type: DataTypes.STRING,
      },
      documento_criacao: {
        type: DataTypes.STRING,
      },
      composicao_cadeiras_set_pub: {
        type: DataTypes.INTEGER,
      },
      composicao_cadeiras_soc_civ: {
        type: DataTypes.INTEGER,
      },
      composicao_cadeiras_outros: {
        type: DataTypes.JSONB,
      },
      coordenacao: {
        type: DataTypes.INTEGER,
      },
      coordenacao_especifique: {
        type: DataTypes.STRING,
      },
      regimento_interno_tem: {
        type: DataTypes.BOOLEAN,
      },
      regimento_interno: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'comissoes',
      paranoid: true,
      schema: 'ciea',
    },
  );

  Commission.associate = function (models) {
    Commission.belongsTo(models["File"], {
      foreignKey: "logo_arquivo",
    });
    Commission.belongsTo(models["File"], {
      foreignKey: "documento_criacao_arquivo",
    });
    Commission.belongsTo(models["File"], {
      foreignKey: "regimento_interno_arquivo",
    })
  }

  return Commission;
};
