require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const fs = require("fs");
const path = require("path");
const db = require("../src/db/pool");

async function migrate() {
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../src/db/migrations/001_auth.sql"),
    "utf8",
  );
  await db.query(sql);
  console.log("Authentication PostgreSQL migration applied.");
}
migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
