const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const useSSL = String(process.env.DATABASE_SSL).toLowerCase() === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

async function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8");
  const client = await pool.connect();
  try {
    await client.query(schema);
  } finally {
    client.release();
  }
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
