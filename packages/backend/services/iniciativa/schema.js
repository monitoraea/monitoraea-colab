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
      nome: {
        type: DataTypes.STRING,
      },
      tema: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      objetivos: {
        type: DataTypes.STRING,
      },
      resumo: {
        type: DataTypes.STRING,
      },
      data_inicio: {
        type: DataTypes.STRING,
      },
      data_fim: {
        type: DataTypes.STRING,
      },
      publicos: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      ufs: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      financiadores: {
        type: DataTypes.STRING,
      },
      community_id: {
        type: DataTypes.INTEGER,
      },
      link: {
        type: DataTypes.STRING,
      },
      instituicao_nome: {
        type: DataTypes.STRING,
      },
      instituicao_segmento: {
        type: DataTypes.INTEGER
      },
      instituicao_porte: {
        type: DataTypes.INTEGER
      },
      instituicao_link: {
        type: DataTypes.STRING,
      },
      responsavel_items: {
        type: DataTypes.JSONB,
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
