const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db/pool");
const datasetRepository = require("../src/repositories/datasetRepository");

test("findAll returns the user's and ThingSpeak datasets with their row counts", async () => {
  const originalQuery = db.query;
  let query;
  let params;
  db.query = async (sql, values) => {
    query = sql;
    params = values;
    return {
      rows: [
        { id: 1, name: "microclimate", totalRows: 3 },
        { id: 2, name: "empty-dataset", totalRows: 0 },
      ],
    };
  };

  try {
    const datasets = await datasetRepository.findAll(
      "active",
      "user-uuid",
      "thingspeak-owner-uuid",
    );

    assert.deepEqual(datasets, [
      { id: 1, name: "microclimate", totalRows: 3 },
      { id: 2, name: "empty-dataset", totalRows: 0 },
    ]);
    assert.match(query, /LEFT JOIN timeseries t ON t\.dataset_id = d\.id/);
    assert.match(query, /COUNT\(t\.entry_id\)::integer AS "totalRows"/);
    assert.match(query, /d\.deleted_at IS NULL/);
    assert.match(query, /d\.created_by = \$1 OR d\.created_by = \$2/);
    assert.deepEqual(params, ["user-uuid", "thingspeak-owner-uuid"]);
  } finally {
    db.query = originalQuery;
  }
});

test("findById returns dataset detail with its total persisted row count", async () => {
  const originalQuery = db.query;
  let query;
  let params;
  db.query = async (sql, values) => {
    query = sql;
    params = values;
    return {
      rows: [
        {
          id: 1,
          name: "microclimate",
          description: "Greenhouse sensor data",
          timestampField: "Time",
          totalRows: 3,
          mappings: [
            {
              sourceField: "AirTemperature",
              storageField: "field1",
              sourceDataType: "number",
              displayName: "Temperature",
            },
          ],
        },
      ],
    };
  };

  try {
    const dataset = await datasetRepository.findById(
      1,
      "user-uuid",
      "thingspeak-owner-uuid",
    );

    assert.deepEqual(dataset, {
      id: 1,
      name: "microclimate",
      description: "Greenhouse sensor data",
      timestampField: "Time",
      totalRows: 3,
      mappings: [
        {
          sourceField: "AirTemperature",
          storageField: "field1",
          sourceDataType: "number",
          displayName: "Temperature",
        },
      ],
    });
    assert.deepEqual(params, [1, "user-uuid", "thingspeak-owner-uuid"]);
    assert.match(query, /FROM timeseries t/);
    assert.match(query, /COUNT\(\*\)::integer/);
    assert.match(query, /FROM dataset_field_mappings m/);
    assert.match(query, /AS mappings/);
    assert.match(query, /timestamp_field AS "timestampField"/);
    assert.match(query, /d\.description/);
    assert.match(query, /WHERE d\.id = \$1/);
    assert.match(query, /d\.deleted_at IS NULL/);
    assert.match(query, /d\.created_by = \$2 OR d\.created_by = \$3/);
  } finally {
    db.query = originalQuery;
  }
});

test("legacy public dataset reads keep active-dataset filtering without owner parameters", async () => {
  const originalQuery = db.query;
  const calls = [];
  db.query = async (sql, values) => {
    calls.push({ sql, values });
    return { rows: [] };
  };

  try {
    await datasetRepository.findAll("active");
    await datasetRepository.findById(42);

    assert.equal(calls[0].values.length, 0);
    assert.match(calls[0].sql, /d\.deleted_at IS NULL/);
    assert.doesNotMatch(calls[0].sql, /d\.created_by = \$1/);
    assert.deepEqual(calls[1].values, [42]);
    assert.match(calls[1].sql, /d\.deleted_at IS NULL/);
    assert.doesNotMatch(calls[1].sql, /d\.created_by = \$2/);
  } finally {
    db.query = originalQuery;
  }
});
