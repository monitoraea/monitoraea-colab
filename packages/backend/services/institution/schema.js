module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const Institution = sequelize.define(
        "institution",
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
        tableName: 'instituicoes',
        timestamps: false,
    }
    );

    return Institution;
};