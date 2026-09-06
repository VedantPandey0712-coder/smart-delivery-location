// Run with: npm run db:init
// Reads schema.sql and executes it against DATABASE_URL.
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function main() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  console.log("Connecting to database...");
  const client = await pool.connect();
  try {
    console.log("Running schema.sql (creates PostGIS extension + tables)...");
    await client.query(schema);
    console.log("✅ Database initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
