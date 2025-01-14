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
      },
      {
        tableName: 'cnes',
        paranoid: true,
        schema: 'cne',
      },
    );
  
    // CNE.associate = function (models) {
      
      
    // }
  
    return CNE;
  };  