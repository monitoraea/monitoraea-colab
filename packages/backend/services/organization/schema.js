module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Organization = sequelize.define(
        "organization",
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
            segmentos: {
                type: DataTypes.ARRAY(DataTypes.INTEGER),
            },
            porte: {
                type: DataTypes.ENUM('pequeno','medio', 'grande'),
            },
        }, {
        tableName: 'organizacoes',
        timestamps: false,
    }
    );

    return Organization;
};