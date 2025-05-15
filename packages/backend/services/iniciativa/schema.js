module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Iniciativa = sequelize.define(
    'iniciativa',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      politica_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      legacy_id: {
        type: DataTypes.INTEGER,
      },
      enquadramento_1: {
        type: DataTypes.INTEGER,
      },
      enquadramento_1_just: {
        type: DataTypes.STRING,
      },
      enquadramento_2: {
        type: DataTypes.INTEGER,
      },
      enquadramento_2_just: {
        type: DataTypes.STRING,
      },
      enquadramento_3: {
        type: DataTypes.INTEGER,
      },
      enquadramento_3_just: {
        type: DataTypes.STRING,
      },
      enquadramento_4: {
        type: DataTypes.INTEGER,
      },
      enquadramento_4_just: {
        type: DataTypes.STRING,
      },
      instituicao_nome: {
        type: DataTypes.STRING,
      },
      instituicao_enquadramento: {
        type: DataTypes.INTEGER,
      },
      responsavel_nome: {
        type: DataTypes.STRING,
      },
      responsavel_cargo: {
        type: DataTypes.STRING,
      },
      responsavel_telefone: {
        type: DataTypes.STRING,
      },
      responsavel_email: {
        type: DataTypes.STRING,
      },
      nome: {
        type: DataTypes.STRING,
      },
      community_id: {
        type: DataTypes.INTEGER,
      },
      link: {
        type: DataTypes.STRING,
      },
      fase: {
        type: DataTypes.INTEGER,
      },
      fase_ano: {
        type: DataTypes.INTEGER,
      },
      fase_descricao: {
        type: DataTypes.TEXT,
      },
      area: {
        type: DataTypes.INTEGER,
      },
      area_tematica: {
        type: DataTypes.STRING,
      },
      dificuldades: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      contemplados: {
        type: DataTypes.TEXT,
      },
      indicadores: {
        type: DataTypes.JSONB,
      },
      indicadores2024: {
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
    },
    {
      tableName: 'iniciativas',
      paranoid: true,
      schema: 'iniciativas',
    },
  );

  return Iniciativa;
};
