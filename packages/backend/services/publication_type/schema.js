module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Publication_type = sequelize.define(
        "publication_type",
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
        tableName: 'publication_type',
    }
    );

    return Publication_type;
};