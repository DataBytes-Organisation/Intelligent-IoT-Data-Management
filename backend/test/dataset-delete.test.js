const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db/pool");
const datasetRepository = require("../src/repositories/datasetRepository");

function mockClient(handler) {
  const calls = [];
  return {
    calls,
    released: false,
    async query(sql, values) {
      calls.push({ sql, values });
      return handler(sql, values, calls);
    },
    release() {
      this.released = true;
    },
  };
}

function assertNoDeleteOrUpdate(calls) {
  assert.equal(
    calls.some((call) => /DELETE FROM timeseries/.test(call.sql)),
    false,
  );
  assert.equal(
    calls.some((call) => /UPDATE datasets/.test(call.sql)),
    false,
  );
}

test("deleteDataset soft-deletes an owned active dataset and removes synced rows", async () => {
  const originalConnect = db.connect;
  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK")
      return { rows: [], rowCount: 0 };
    if (/SELECT id, name/.test(sql))
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            description: "April readings",
            timestampField: "Time",
            createdBy: "user-uuid",
            deletedAt: null,
          },
        ],
      };
    if (/DELETE FROM timeseries WHERE/.test(sql))
      return { rows: [], rowCount: 3 };
    if (/DELETE FROM timeseries_long WHERE/.test(sql))
      return { rows: [], rowCount: 7 };
    if (/UPDATE datasets/.test(sql))
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            description: "April readings",
            timestampField: "Time",
            deletedAt: "2026-09-16T02:00:00.000Z",
            deletedBy: "user-uuid",
            dataDeletedAt: "2026-09-16T02:00:00.000Z",
            updatedAt: "2026-09-16T02:00:00.000Z",
          },
        ],
      };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  db.connect = async () => client;

  try {
    const result = await datasetRepository.deleteDataset(
      42,
      {
        sub: "user-uuid",
        role: "user",
      },
      "thingspeak-live",
    );

    assert.equal(result.id, 42);
    assert.deepEqual(result.deletedRows, {
      timeseries: 3,
      timeseriesLong: 7,
    });
    assert.equal(client.released, true);
    assert.deepEqual(
      client.calls.map((call) => call.sql === "BEGIN" || call.sql === "COMMIT" ? call.sql : call.sql.match(/^\s*(SELECT|DELETE|UPDATE)/)[1]),
      ["BEGIN", "SELECT", "DELETE", "DELETE", "UPDATE", "COMMIT"],
    );
    assert.match(client.calls[1].sql, /FOR UPDATE/);
    assert.match(client.calls[1].sql, /created_by = \$2/);
    assert.match(client.calls[1].sql, /name <> \$3/);
    assert.deepEqual(client.calls[1].values, [
      42,
      "user-uuid",
      "thingspeak-live",
    ]);
    assert.match(client.calls[2].sql, /DELETE FROM timeseries WHERE dataset_id = \$1/);
    assert.match(client.calls[3].sql, /DELETE FROM timeseries_long WHERE dataset_id = \$1/);
    assert.doesNotMatch(
      client.calls.map((call) => call.sql).join("\n"),
      /DELETE FROM dataset_field_mappings/,
    );
    assert.match(client.calls[4].sql, /deleted_at = CURRENT_TIMESTAMP/);
    assert.match(client.calls[4].sql, /deleted_by = \$2/);
    assert.match(client.calls[4].sql, /data_deleted_at = CURRENT_TIMESTAMP/);
    assert.deepEqual(client.calls[4].values, [42, "user-uuid"]);
  } finally {
    db.connect = originalConnect;
  }
});

test("deleteDataset hides another user's dataset before deleting rows", async () => {
  const originalConnect = db.connect;
  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK")
      return { rows: [], rowCount: 0 };
    if (/SELECT id, name/.test(sql))
      return { rows: [] };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.deleteDataset(
          42,
          {
            sub: "other-user-uuid",
            role: "user",
          },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found.",
    );
    assert.match(client.calls[1].sql, /created_by = \$2/);
    assert.match(client.calls[1].sql, /name <> \$3/);
    assert.deepEqual(client.calls[1].values, [
      42,
      "other-user-uuid",
      "thingspeak-live",
    ]);
    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoDeleteOrUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("deleteDataset hides the protected ThingSpeak live dataset before deleting rows", async () => {
  const originalConnect = db.connect;
  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK")
      return { rows: [], rowCount: 0 };
    if (/SELECT id, name/.test(sql))
      return { rows: [] };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.deleteDataset(
          42,
          {
            sub: "user-uuid",
            role: "user",
          },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found.",
    );
    assert.match(client.calls[1].sql, /name <> \$3/);
    assert.deepEqual(client.calls[1].values, [
      42,
      "user-uuid",
      "thingspeak-live",
    ]);
    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoDeleteOrUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("deleteDataset rejects an already deleted dataset", async () => {
  const originalConnect = db.connect;
  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK")
      return { rows: [], rowCount: 0 };
    if (/SELECT id, name/.test(sql))
      return {
        rows: [
          {
            id: 42,
            createdBy: "user-uuid",
            deletedAt: "2026-09-16T02:00:00.000Z",
          },
        ],
      };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.deleteDataset(
          42,
          {
            sub: "user-uuid",
            role: "user",
          },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_ALREADY_DELETED" &&
        error.status === 409 &&
        error.message === "Dataset has already been deleted.",
    );
    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoDeleteOrUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("deleteDataset rolls back if synced row deletion fails", async () => {
  const originalConnect = db.connect;
  const failure = new Error("database delete failed");
  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK")
      return { rows: [], rowCount: 0 };
    if (/SELECT id, name/.test(sql))
      return {
        rows: [
          {
            id: 42,
            createdBy: "user-uuid",
            deletedAt: null,
          },
        ],
      };
    if (/DELETE FROM timeseries WHERE/.test(sql))
      return { rows: [], rowCount: 3 };
    if (/DELETE FROM timeseries_long WHERE/.test(sql))
      throw failure;
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.deleteDataset(
          42,
          {
            sub: "user-uuid",
            role: "user",
          },
          "thingspeak-live",
        ),
      failure,
    );
    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assert.equal(
      client.calls.some((call) => /UPDATE datasets/.test(call.sql)),
      false,
    );
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});
