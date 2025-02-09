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
      })
      
    }
  
    return CNE;
  };  