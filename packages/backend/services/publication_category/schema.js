module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Publication_category = sequelize.define(
        "publication_category",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                field: 'name',
                type: DataTypes.STRING,
                allowNull: false,
            },
        }, {
        tableName: 'publicacoes_categorias',
    }
    );

    return Publication_category;
};