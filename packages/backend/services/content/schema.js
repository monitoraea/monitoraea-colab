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
      intro: {
        type: DataTypes.STRING,
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
      },
      show_title: {
        type: DataTypes.BOOLEAN,
      }   
    },
    {
      tableName: 'contents',
      paranoid: true,
    },
  );

  return Content;
};
