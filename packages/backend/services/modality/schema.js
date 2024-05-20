module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Modality = sequelize.define(
        "modality",
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
        tableName: 'modalidades',
        timestamps: false,
    }
    );

    return Modality;
};