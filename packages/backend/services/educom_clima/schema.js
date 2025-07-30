module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Educomclima = sequelize.define(
    'educomclima',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      iniciativa_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      versao: {
        type: DataTypes.INTEGER,
      },
      email: {
        type: DataTypes.STRING,
      },
      acao_enfrentamento: {
        type: DataTypes.INTEGER,
      },
      nome: {
        type: DataTypes.STRING,
      },
      uf: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
      definicao: {
        type: DataTypes.INTEGER,
      },
      faixa_etaria: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
      participantes_genero: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
      racas_etnias: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
      temas: {
        type: DataTypes.TEXT,
      },
      midias: {
        type: DataTypes.TEXT,
      },
      estrategias_educativas: {
        type: DataTypes.TEXT,
      },
      noticia_falsa_recebeu: {
        type: DataTypes.INTEGER,
      },
      noticia_falsa_exemplo: {
        type: DataTypes.TEXT,
      },
      aborda_desinformacao: {
        type: DataTypes.INTEGER,
      },
      aborda_desinformacao_exemplo: {
        type: DataTypes.TEXT,
      },
      apresentacao: {
        type: DataTypes.TEXT,
      },
      materiais_didaticos: {
        type: DataTypes.TEXT,
      },
      redes_sociais: {
        type: DataTypes.STRING,
      },
      conte_mais: {
        type: DataTypes.TEXT,
      },
      nivel: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
      },
    },
    {
      tableName: 'iniciativas',
      paranoid: true,
      schema: 'educom_clima',
    },
  );

  return Educomclima;
};
