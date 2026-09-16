const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db/pool");
const datasetRepository = require("../src/repositories/datasetRepository");

test("findAll returns each dataset name with its total persisted row count", async () => {
  const originalQuery = db.query;
  let query;
  db.query = async (sql) => {
    query = sql;
    return {
      rows: [
        { id: 1, name: "microclimate", totalRows: 3 },
        { id: 2, name: "empty-dataset", totalRows: 0 },
      ],
    };
  };

  try {
    const datasets = await datasetRepository.findAll();

    assert.deepEqual(datasets, [
      { id: 1, name: "microclimate", totalRows: 3 },
      { id: 2, name: "empty-dataset", totalRows: 0 },
    ]);
    assert.match(query, /LEFT JOIN timeseries t ON t\.dataset_id = d\.id/);
    assert.match(query, /COUNT\(t\.entry_id\)::integer AS "totalRows"/);
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
    const dataset = await datasetRepository.findById(1);

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
    assert.deepEqual(params, [1]);
    assert.match(query, /FROM timeseries t/);
    assert.match(query, /COUNT\(\*\)::integer/);
    assert.match(query, /FROM dataset_field_mappings m/);
    assert.match(query, /AS mappings/);
    assert.match(query, /timestamp_field AS "timestampField"/);
    assert.match(query, /d\.description/);
    assert.match(query, /WHERE d\.id = \$1/);
  } finally {
    db.query = originalQuery;
  }
});
