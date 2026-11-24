const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    "../src/db/migrations/005_analysis_runs_and_alerts.sql",
  );

  let client;

  try {
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Running analysis migration...");

    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("Analysis migration completed successfully.");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
