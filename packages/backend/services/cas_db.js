// Independent Drizzle/pg client for @community-assistant/server, pointed at
// the same Postgres database as the app's own Sequelize connection
// (services/database.js). Mirrors the precedent already established by
// dorothy-dna-services, which also runs its own separate Sequelize instance
// against this same DATABASE_URL — a third client here is not a new pattern.

const { Pool } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");

const dbString = process.env.DATABASE_URL;

const poolConfig = { connectionString: dbString };

if (process.env.NO_DATABASE_SSL != 1) {
  poolConfig.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);
const db = drizzle(pool);

module.exports = db;
