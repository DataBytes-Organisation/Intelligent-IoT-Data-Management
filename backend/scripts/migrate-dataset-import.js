const fs = require("fs");
const path = require("path");
const db = require("../src/db/pool");

async function migrate() {
  try {
    await db.query(
      fs.readFileSync(
        path.resolve(__dirname, "../src/db/migrations/002_dataset_management.sql"),
        "utf8",
      ),
    );
    console.log("Dataset CSV import PostgreSQL migration applied.");
  } finally {
    await db.end();
  }
}

migrate().catch((error) => {
  console.error("Dataset CSV import migration failed:", error);
  process.exitCode = 1;
});
