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

function assertNoRestoreUpdate(calls) {
  assert.equal(
    calls.some((call) => /UPDATE datasets/.test(call.sql)),
    false,
  );
}

test("restoreDataset restores an owned dataset and clears deletion state", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            description: "April readings",
            timestampField: "Time",
            createdBy: "user-uuid",
            deletedAt: "2026-09-10T02:00:00.000Z",
            dataDeletedAt: "2026-09-10T02:00:00.000Z",
          },
        ],
      };
    }

    if (sql.includes("INTERVAL '15 days'")) {
      return { rows: [{ expired: false }] };
    }

    if (/SELECT 1/.test(sql)) {
      return { rows: [] };
    }

    if (/UPDATE datasets/.test(sql)) {
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            description: "April readings",
            timestampField: "Time",
            createdBy: "user-uuid",
            updatedBy: "user-uuid",
            createdAt: "2026-09-01T02:00:00.000Z",
            updatedAt: "2026-09-16T02:00:00.000Z",
          },
        ],
      };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    const result = await datasetRepository.restoreDataset(
      42,
      { sub: "user-uuid", role: "user" },
      "thingspeak-live",
    );

    assert.equal(result.id, 42);
    assert.equal(result.name, "microclimate");
    assert.equal(client.released, true);

    assert.match(client.calls[1].sql, /created_by = \$2/);
    assert.match(client.calls[1].sql, /name <> \$3/);
    assert.deepEqual(client.calls[1].values, [
      42,
      "user-uuid",
      "thingspeak-live",
    ]);

    assert.match(
      client.calls[4].sql,
      /deleted_at = NULL/,
    );
    assert.match(
      client.calls[4].sql,
      /deleted_by = NULL/,
    );
    assert.match(
      client.calls[4].sql,
      /data_deleted_at = NULL/,
    );
  } finally {
    db.connect = originalConnect;
  }
});

test("restoreDataset hides another user's dataset and does not update it", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return { rows: [] };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.restoreDataset(
          42,
          { sub: "other-user-uuid", role: "user" },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found.",
    );

    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoRestoreUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("restoreDataset hides the protected ThingSpeak live dataset and does not update it", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return { rows: [] };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.restoreDataset(
          42,
          { sub: "user-uuid", role: "user" },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_NOT_FOUND" &&
        error.status === 404 &&
        error.message === "Dataset not found.",
    );

    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoRestoreUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("restoreDataset rejects an expired recovery period without updating", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            createdBy: "user-uuid",
            deletedAt: "2026-08-01T02:00:00.000Z",
          },
        ],
      };
    }

    if (sql.includes("INTERVAL '15 days'")) {
      return { rows: [{ expired: true }] };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.restoreDataset(
          42,
          { sub: "user-uuid", role: "user" },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "RECOVERY_EXPIRED" &&
        error.status === 410 &&
        error.message === "Dataset recovery period has expired.",
    );

    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoRestoreUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("restoreDataset rejects an active dataset", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            createdBy: "user-uuid",
            deletedAt: null,
          },
        ],
      };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.restoreDataset(
          42,
          { sub: "user-uuid", role: "user" },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "INVALID_RESTORE_REQUEST" &&
        error.status === 400,
    );

    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoRestoreUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("restoreDataset rejects an active dataset name conflict", async () => {
  const originalConnect = db.connect;

  const client = mockClient(async (sql) => {
    if (sql === "BEGIN" || sql === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT id, name/.test(sql)) {
      return {
        rows: [
          {
            id: 42,
            name: "microclimate",
            createdBy: "user-uuid",
            deletedAt: "2026-09-10T02:00:00.000Z",
          },
        ],
      };
    }

    if (sql.includes("INTERVAL '15 days'")) {
      return { rows: [{ expired: false }] };
    }

    if (/SELECT 1/.test(sql)) {
      return { rows: [{ "?column?": 1 }] };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  db.connect = async () => client;

  try {
    await assert.rejects(
      () =>
        datasetRepository.restoreDataset(
          42,
          { sub: "user-uuid", role: "user" },
          "thingspeak-live",
        ),
      (error) =>
        error.code === "DATASET_NAME_CONFLICT" &&
        error.status === 409 &&
        error.message === "An active dataset with this name already exists.",
    );

    assert.equal(client.calls.at(-1).sql, "ROLLBACK");
    assertNoRestoreUpdate(client.calls);
    assert.equal(client.released, true);
  } finally {
    db.connect = originalConnect;
  }
});
