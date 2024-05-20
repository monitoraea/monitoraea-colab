module.exports = (sequelize, DataTypes) => {
  /*TODO*/
  const Content = sequelize.define(
    'content',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      portal: {
        type: DataTypes.ENUM('main','monitoraea','pp','pppzcm'),
      },
      type: {
        type: DataTypes.ENUM('news','page', 'helpbox', 'learning', 'publication', 'faq'),
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      featured_images: {
        type: DataTypes.STRING,
      },
      published: {
        type: DataTypes.BOOLEAN,
      },
      publishedAt: {
        type: DataTypes.DATE,
      },
      categories: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      level: {
        type: DataTypes.INTEGER,
      }    
    },
    {
      tableName: 'contents',
      paranoid: true,
    },
  );

  return Content;
};
