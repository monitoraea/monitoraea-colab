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
      programa_estadual_tem: {
        type: DataTypes.BOOLEAN,
      },
      programa_estadual_decreto: {
        type: DataTypes.STRING,
      },
      programa_estadual_lei: {
        type: DataTypes.STRING,
      },
      plano_estadual_tem: {
        type: DataTypes.BOOLEAN,
      },
      plano_estadual_decreto: {
        type: DataTypes.STRING,
      },
      plano_estadual_lei: {
        type: DataTypes.STRING,
      },
      indicadores: {
        type: DataTypes.JSONB,
      },
      ppea_outra_tem: {
        type: DataTypes.BOOLEAN,
      },
      ppea_outra_decreto: {
        type: DataTypes.STRING,
      },
      ppea_outra_lei: {
        type: DataTypes.STRING,
      },
      coordenacao_quem: {
        type: DataTypes.JSONB,
      },
      tipo_colegiado: {
        type: DataTypes.INTEGER,
      },
      tipo_colegiado_outro: {
        type: DataTypes.STRING,
      },
      nivel_atuacao: {
        type: DataTypes.INTEGER,
      },
      nivel_atuacao_outro: {
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
    Commission.belongsTo(models["File"], {
      foreignKey: "programa_estadual_arquivo",
    })
    Commission.belongsTo(models["File"], {
      foreignKey: "plano_estadual_arquivo",
    })
    Commission.belongsTo(models["File"], {
      foreignKey: "ppea_outra_arquivo",
    })

  }

  return Commission;
};
