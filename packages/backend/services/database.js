const path = require("path");
const fs = require("fs");
const Sequelize = require("sequelize");

const { capitalize } = require("../utils");

const services = require(".");
class Database {
  constructor() {
    const dbString = process.env.DATABASE_URL;

    console.log("📚 Database instantiated!");

    this.sequelize = new Sequelize(dbString, {
      logging: process.env.LOG_SEQUELIZE === "1" ? console.log : false,

      dialect: "postgres",
      dialectOptions: {
/*        ssl: {
          require: true,
          rejectUnauthorized: false // <<<<<<< YOU NEED THIS
      }*/
      }

    });

    this.models = {};

    /* Models */
    services.forEach((m) => {
      let ePath = path.resolve("services", `${m}/schema.js`);
      if (fs.existsSync(ePath)) {
        this.models[capitalize(m)] = require(ePath)(
          this.sequelize,
          Sequelize.DataTypes
        );
      }
    });

    /* Associations */
    Object.keys(this.models).forEach((modelName) => {
      if (this.models[modelName].associate) {
        this.models[modelName].associate(this.models);
      }
    });
  }

  instance() {
    return this.sequelize;
  }
}

const singletonInstance = new Database();
module.exports = singletonInstance;
