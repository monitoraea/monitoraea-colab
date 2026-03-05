const Sequelize = require('sequelize');

class Database {
    constructor() {
        const dbString = process.env.DATABASE_URL;

        console.log('📚 Database (dorothy-services) instantiated!');

        this.sequelize = new Sequelize(dbString, {
            logging: process.env.LOG_SEQUELIZE === '1' ? console.log : false,

            dialect: "postgres",
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false // <<<<<<< YOU NEED THIS
              }
            },
        });
    }

    instance() {
        return this.sequelize;
    }
}

const singletonInstance = new Database();
module.exports = singletonInstance;
