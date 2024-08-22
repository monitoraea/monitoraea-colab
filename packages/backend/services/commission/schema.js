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
      org_interna_periodicidade: {
        type: DataTypes.INTEGER,
      },
      organizacao_interna_periodicidade_especifique: {
        type: DataTypes.STRING,
      },
      organizacao_interna_estrutura_tem: {
        type: DataTypes.BOOLEAN,
      },
      organizacao_interna_estrutura_especifique: {
        type: DataTypes.STRING,
      },
      ppea_tem: {
        type: DataTypes.BOOLEAN,
      },
      ppea_decreto: {
        type: DataTypes.STRING,
      },
      ppea_lei: {
        type: DataTypes.STRING,
      },
      ppea2_tem: {
        type: DataTypes.BOOLEAN,
      },
      ppea2_decreto: {
        type: DataTypes.STRING,
      },
      ppea2_lei: {
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
    Commission.belongsTo(models["File"], {
      foreignKey: "ppea_arquivo",
    })
    Commission.belongsTo(models["File"], {
      foreignKey: "ppea2_arquivo",
    })
    
  }

  return Commission;
};
