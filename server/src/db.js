const { Pool } = require("pg");
require("dotenv").config();

const useSSL = String(process.env.DATABASE_SSL).toLowerCase() === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

module.exports = pool;
