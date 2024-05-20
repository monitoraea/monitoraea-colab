module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Policy = sequelize.define(
        "policy",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                field: 'nome',
                type: DataTypes.STRING,
                allowNull: false,
            },
        }, {
        tableName: 'politicas',
        timestamps: false,
    }
    );

    return Policy;
};