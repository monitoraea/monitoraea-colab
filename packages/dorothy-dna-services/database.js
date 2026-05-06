const Sequelize = require('sequelize');

class Database {
  constructor() {
    const dbString = process.env.DATABASE_URL;

    let db_options = {
      logging: process.env.LOG_SEQUELIZE === '1' ? console.log : false,
      benchmark: process.env.LOG_SEQUELIZE_BENCHMARK === '1',

      dialect: "postgres",
    }

    console.log(`📚 Database Dorothy Services SSL=${process.env.NO_DATABASE_SSL == 1 ? 'off' : 'on'}`);

    if (process.env.NO_DATABASE_SSL != 1) {
      db_options.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false // <<<<<<< YOU NEED THIS
        }
      }
    }

    this.sequelize = new Sequelize(dbString, db_options);
  }

  instance() {
    return this.sequelize;
  }
}

const singletonInstance = new Database();
module.exports = singletonInstance;
