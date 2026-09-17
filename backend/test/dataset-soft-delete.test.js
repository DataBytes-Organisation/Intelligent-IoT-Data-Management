const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db/pool");
const datasetRepository = require("../src/repositories/datasetRepository");

const USER_ID = "user-123";
const THINGSPEAK_OWNER_ID = "thingspeak-owner-456";

test("findAll(active) excludes soft-deleted datasets and scopes to owner", async () => {
  const originalQuery = db.query;
  let capturedSql;
  let capturedParams;
  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return { rows: [{ id: 1, name: "active-one", totalRows: 5 }] };
  };
  try {
    const rows = await datasetRepository.findAll(
      "active",
      USER_ID,
      THINGSPEAK_OWNER_ID,
    );
    assert.match(capturedSql, /d\.deleted_at IS NULL/);
    assert.match(capturedSql, /created_by = \$1 OR d\.created_by = \$2/);
    assert.deepEqual(capturedParams, [USER_ID, THINGSPEAK_OWNER_ID]);
    assert.equal(rows.length, 1);
  } finally {
    db.query = originalQuery;
  }
});

test("findAll(deleted) excludes datasets past the recovery window", async () => {
  const originalQuery = db.query;
  let capturedSql;
  db.query = async (sql) => {
    capturedSql = sql;
    return { rows: [] }; // EXCLUDE EXPIRED ROW SO NOTHING IS RETURNED
  };
  try {
    const rows = await datasetRepository.findAll(
      "deleted",
      USER_ID,
      THINGSPEAK_OWNER_ID,
    );
    assert.match(
      capturedSql,
      /d\.deleted_at > CURRENT_TIMESTAMP - INTERVAL '15 days'/,
    );
    assert.equal(rows.length, 0);
  } finally {
    db.query = originalQuery;
  }
});

test("findAll(deleted) computes recoveryExpiresAt and remainingRecoveryDays from deletedAt", async () => {
  const originalQuery = db.query;
  const deletedAt = new Date(Date.now() - 60000); // deleted 1 minute ago, avoids rounding flakiness
  db.query = async () => ({
    rows: [
      {
        id: 2,
        name: "deleted-one",
        totalRows: 3,
        deletedAt: deletedAt.toISOString(),
      },
    ],
  });
  try {
    const rows = await datasetRepository.findAll(
      "deleted",
      USER_ID,
      THINGSPEAK_OWNER_ID,
    );
    const expectedExpiry = new Date(deletedAt.getTime() + 15 * 86400000);
    assert.equal(rows[0].recoveryExpiresAt, expectedExpiry.toISOString());
    assert.equal(rows[0].remainingRecoveryDays, 14);
  } finally {
    db.query = originalQuery;
  }
});

test("findAll(deleted) floors remainingRecoveryDays at 0 once the window has passed", async () => {
  const originalQuery = db.query;
  const deletedAt = new Date(Date.now() - 20 * 86400000); // deleted 20 days ago, window is 15
  db.query = async () => ({
    rows: [
      {
        id: 3,
        name: "expired-one",
        totalRows: 0,
        deletedAt: deletedAt.toISOString(),
      },
    ],
  });
  try {
    const rows = await datasetRepository.findAll(
      "deleted",
      USER_ID,
      THINGSPEAK_OWNER_ID,
    );
    assert.equal(rows[0].remainingRecoveryDays, 0);
  } finally {
    db.query = originalQuery;
  }
});

test("getAccessibleDatasetId excludes soft-deleted datasets and scopes to owner", async () => {
  const originalQuery = db.query;
  let capturedSql;
  const TimeseriesRepository = require("../src/repositories/timeseriesRepository");
  const timeseriesRepository = new TimeseriesRepository();
  db.query = async (sql) => {
    capturedSql = sql;
    return { rows: [] };
  };
  try {
    const id = await timeseriesRepository.getAccessibleDatasetId(
      999,
      USER_ID,
      THINGSPEAK_OWNER_ID,
    );
    assert.match(capturedSql, /deleted_at IS NULL/);
    assert.match(capturedSql, /created_by = \$2 OR created_by = \$3/);
    assert.equal(id, null);
  } finally {
    db.query = originalQuery;
  }
});

test("replaceMappingsAndAddRows rejects updates to a soft-deleted dataset", async () => {
  const originalQuery = db.query;
  const originalConnect = db.connect;
  let capturedSql;
  const mockClient = {
    query: async (sql, params) => {
      if (sql.includes("FOR UPDATE")) {
        capturedSql = sql;
        return { rows: [] }; // soft-deleted dataset is excluded, so nothing comes back
      }
      return { rows: [] };
    },
    release: () => {},
  };
  db.connect = async () => mockClient;
  try {
    await assert.rejects(
      () =>
        datasetRepository.replaceMappingsAndAddRows(1, {
          description: "test",
          timestampField: "Time",
          mappings: [],
          wideRows: [],
          user: { sub: USER_ID, role: "user" },
        }),
      (error) => error.code === "DATASET_NOT_FOUND",
    );
    assert.match(capturedSql, /deleted_at IS NULL/);
  } finally {
    db.connect = originalConnect;
    db.query = originalQuery;
  }
});
