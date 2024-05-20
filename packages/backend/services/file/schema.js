module.exports = (sequelize, DataTypes) => {

    /*TODO*/
    const File = sequelize.define('file', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        file_name: {
            type: DataTypes.STRING,
        },
        url: {
            type: DataTypes.STRING,
        },
        document_type: {
            type: DataTypes.STRING,
        },
        content_type: {
            type: DataTypes.STRING,
        }
    });

    return File;
};