module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Publication = sequelize.define(
        "publication",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            year: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            link: {
                type: DataTypes.STRING,
            },
        }, {
        tableName: 'publicacoes',
    }
    );

    Publication.associate = function (models) {
        Publication.belongsTo(models["Publication_category"], {
          foreignKey: "categoria_id",
        });
        Publication.belongsTo(models["Publication_type"], {
          foreignKey: "tipo_id",
        });
        
      }

    return Publication;
};