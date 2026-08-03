module.exports = (sequelize, DataTypes) => {
    /*TODO*/
    const CNE = sequelize.define(
      'cne',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        cne_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        nome: {
          type: DataTypes.STRING,
        },
        tipologia: {
          type: DataTypes.INTEGER,
        },
        community_id: {
          type: DataTypes.INTEGER,
        },
        instituicao_id: {
          type: DataTypes.INTEGER,
        },
        intitutions_it: {
          type: DataTypes.JSONB,
        },
        managers_it: {
          type: DataTypes.JSONB,
        },
        data_criacao: {
          type: DataTypes.STRING,
        },
        data_inst: {
          type: DataTypes.STRING,
        },
        cnpj: {
          type: DataTypes.STRING,
        },
        estrategia_desc: {
          type: DataTypes.STRING,
        },
        estrategia_data: {
          type: DataTypes.STRING,
        },
        detalhamento_desc: {
          type: DataTypes.STRING,
        },
        detalhamento_data: {
          type: DataTypes.STRING,
        },
        outcomes_it: {
          type: DataTypes.JSONB,
        },
        versao: {
          type: DataTypes.STRING,
        },
        atuacao_aplica: {
          type: DataTypes.BOOLEAN,
        },
        atuacao_naplica_just: {
          type: DataTypes.TEXT,
        },
        uf: {
          type: DataTypes.INTEGER,
        },
        municipio: {
          type: DataTypes.INTEGER,
        },
        tipologia_outro: {
          type: DataTypes.STRING,
        },
        possui_instrumento_juridico: {
          type: DataTypes.BOOLEAN,
        },
        possui_ppp: {
          type: DataTypes.BOOLEAN,
        },
        ppp_data: {
          type: DataTypes.STRING,
        },
        possui_espaco_fisico: {
          type: DataTypes.BOOLEAN,
        },
        possui_equipe_dedicada: {
          type: DataTypes.BOOLEAN,
        },
        sustentacao_financeira: {
          type: DataTypes.INTEGER,
        },
        escala_atuacao: {
          type: DataTypes.INTEGER,
        },
        faixa_beneficiarios: {
          type: DataTypes.INTEGER,
        },
        objetivo_articulacao: {
          type: DataTypes.INTEGER,
        },
        objetivo_apoio_centros: {
          type: DataTypes.INTEGER,
        },
        objetivo_incidencia_politicas: {
          type: DataTypes.INTEGER,
        },
        objetivo_producao_conteudo: {
          type: DataTypes.INTEGER,
        },
        objetivo_disponibiliza_dados: {
          type: DataTypes.INTEGER,
        },
        objetivo_mapeamento: {
          type: DataTypes.INTEGER,
        },
        objetivo_monitoramento: {
          type: DataTypes.INTEGER,
        },
        objetivo_formacao: {
          type: DataTypes.INTEGER,
        },
        objetivo_reflexao_critica: {
          type: DataTypes.INTEGER,
        },
        objetivo_atividades_interpretativas: {
          type: DataTypes.INTEGER,
        },
        objetivo_espaco_demonstrativo: {
          type: DataTypes.INTEGER,
        },
        objetivo_capacitacao_renda: {
          type: DataTypes.INTEGER,
        },
        objetivo_apoio_projetos_ea: {
          type: DataTypes.INTEGER,
        },
        objetivo_apoio_programas_mma: {
          type: DataTypes.INTEGER,
        },
        objetivo_pesquisa_intercambio: {
          type: DataTypes.INTEGER,
        },
        tema_mudancas_climaticas: {
          type: DataTypes.INTEGER,
        },
        tema_mudancas_climaticas_descreva: {
          type: DataTypes.STRING,
        },
        tema_biodiversidade: {
          type: DataTypes.INTEGER,
        },
        tema_biodiversidade_descreva: {
          type: DataTypes.STRING,
        },
        tema_recursos_hidricos: {
          type: DataTypes.INTEGER,
        },
        tema_recursos_hidricos_descreva: {
          type: DataTypes.STRING,
        },
        tema_residuos_solidos: {
          type: DataTypes.INTEGER,
        },
        tema_residuos_solidos_descreva: {
          type: DataTypes.STRING,
        },
        tema_energia: {
          type: DataTypes.INTEGER,
        },
        tema_energia_descreva: {
          type: DataTypes.STRING,
        },
        tema_agroecologia: {
          type: DataTypes.INTEGER,
        },
        tema_agroecologia_descreva: {
          type: DataTypes.STRING,
        },
        tema_saude_ambiental: {
          type: DataTypes.INTEGER,
        },
        tema_saude_ambiental_descreva: {
          type: DataTypes.STRING,
        },
        tema_justica_ambiental: {
          type: DataTypes.INTEGER,
        },
        tema_justica_ambiental_descreva: {
          type: DataTypes.STRING,
        },
        tema_povos_tradicionais: {
          type: DataTypes.INTEGER,
        },
        tema_povos_tradicionais_descreva: {
          type: DataTypes.STRING,
        },
        tema_gestao_riscos: {
          type: DataTypes.INTEGER,
        },
        tema_gestao_riscos_descreva: {
          type: DataTypes.STRING,
        },
        tema_economia_solidaria: {
          type: DataTypes.INTEGER,
        },
        tema_economia_solidaria_descreva: {
          type: DataTypes.STRING,
        },
        tema_cidades_sustentaveis: {
          type: DataTypes.INTEGER,
        },
        tema_cidades_sustentaveis_descreva: {
          type: DataTypes.STRING,
        },
        tema_outros_especificar: {
          type: DataTypes.STRING,
        },
      },
      {
        tableName: 'cnes',
        paranoid: true,
        schema: 'cne',
      },
    );

    CNE.associate = function (models) {

      CNE.belongsTo(models["File"], {
        foreignKey: "logo_arquivo",
      });

      CNE.belongsTo(models["File"], {
        foreignKey: "estrategia_arquivo",
      });

      CNE.belongsTo(models["File"], {
        foreignKey: "detalhamento_arquivo",
      });

      CNE.belongsTo(models["File"], {
        foreignKey: "ppp_arquivo",
      });

    }

    return CNE;
  };