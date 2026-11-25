
const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function runMigration() {
  let client;

  try {
    const migrationPath = path.join(
      __dirname,
      "../src/db/migrations/005_create_analytics_alerts.sql"
    );

    const sql = fs.readFileSync(migrationPath, "utf8");

    client = await pool.connect();

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("Analytics alerts migration completed successfully.");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Analytics alerts migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
}

runMigration();
