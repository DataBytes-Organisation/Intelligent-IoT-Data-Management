const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function runMigration() {
  const migrationFiles = [
    "005_analysis_runs_and_alerts.sql",
    "006_extend_analysis_runs.sql",
  ];

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    for (const file of migrationFiles) {
      const migrationPath = path.join(__dirname, "../src/db/migrations", file);

      const sql = fs.readFileSync(migrationPath, "utf8");

      console.log(`Running ${file}...`);
      await client.query(sql);
    }

    await client.query("COMMIT");
    console.log("Analysis migrations completed successfully.");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
}

runMigration();
