const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DatasetImportError,
  importDataset,
  mapRows,
  updateDataset,
  validateImport,
  MAX_CSV_UPLOAD_ROWS,
} = require("../src/services/datasetImportService");
const {
  MAX_CSV_UPLOAD_BYTES,
  maxUploadSizeLabel,
  uploadLimitErrorHandler,
} = require("../src/middleware/uploadLimitMiddleware");

const mappings = [
  { sourceField: "AirTemperature", storageField: "field1", displayName: "Temperature", sourceDataType: "number" },
  { sourceField: "RelativeHumidity", storageField: "field2", displayName: "Humidity", sourceDataType: "number" },
];

test("reviewed CSV fields are converted to a wide time-series row", () => {
  const result = mapRows(
    [
      {
        Time: "2026-04-29T01:25:15+10:00",
        AirTemperature: "16.7",
        RelativeHumidity: "79.9",
      },
    ],
    "Time",
    mappings,
  );
  assert.deepEqual(result, [
    {
      entryId: 1,
      createdAt: "2026-04-28T15:25:15.000Z",
      field1: 16.7,
      field2: 79.9,
    },
  ]);
});

test("an import rejects duplicate storage fields", () => {
  assert.throws(
    () =>
      validateImport({
        name: "Microclimate",
        timestampField: "Time",
        rows: [{ Time: "2026-04-29T01:25:15+10:00", AirTemperature: "16.7" }],
        mappings: [
          { sourceField: "AirTemperature", storageField: "field1", displayName: "Temperature", sourceDataType: "number" },
          { sourceField: "RelativeHumidity", storageField: "field1", displayName: "Humidity", sourceDataType: "number" },
        ],
      }),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields["mappings.1.storageField"] === "Each storage field may be mapped once.",
  );
});

test("invalid numeric selected values fail before any database write", () => {
  assert.throws(
    () =>
      mapRows(
        [{ Time: "2026-04-29T01:25:15+10:00", AirTemperature: "warm" }],
        "Time",
        mappings.slice(0, 1),
      ),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields["rows.0.AirTemperature"] === "Must be a number or an empty value.",
  );
});

test("the authenticated user id and reviewed mappings are passed to the transaction", async () => {
  let received;
  const repository = {
    async createWithMappingsAndRows(input) {
      received = input;
      return { id: 42 };
    },
  };
  const result = await importDataset(
    {
      name: "Microclimate April",
      description: "April microclimate readings.",
      timestampField: "Time",
      mappings,
      rows: [
        {
          Time: "2026-04-29T01:25:15+10:00",
          AirTemperature: "16.7",
          RelativeHumidity: "79.9",
        },
      ],
    },
    "4c7c77b9-2bb8-4a3e-9b7a-4a66782e9dd6",
    repository,
  );
  assert.deepEqual(result, { id: 42 });
  assert.equal(received.userId, "4c7c77b9-2bb8-4a3e-9b7a-4a66782e9dd6");
  assert.equal(received.description, "April microclimate readings.");
  assert.equal(received.timestampField, "Time");
  assert.equal(received.mappings[0].displayName, "Temperature");
  assert.equal(received.wideRows[0].field2, 79.9);
});

test("PUT accepts the same reviewed CSV payload as POST", async () => {
  let received;
  const repository = {
    async replaceMappingsAndAddRows(id, input) {
      received = { id, ...input };
      return { id, addedRowCount: input.wideRows.length };
    },
  };
  const user = { sub: "4c7c77b9-2bb8-4a3e-9b7a-4a66782e9dd6", role: "user" };
  const result = await updateDataset(
    "42",
    {
      timestampField: "Time",
      mappings: mappings.slice(0, 1),
      rows: [
        { Time: "2026-04-29T01:25:15+10:00", AirTemperature: "16.7" },
      ],
    },
    user,
    repository,
  );
  assert.deepEqual(result, { id: 42, addedRowCount: 1 });
  assert.equal(received.id, 42);
  assert.equal(received.user, user);
  assert.equal(received.timestampField, "Time");
  assert.equal(received.wideRows[0].entryId, 1);
  assert.equal(received.wideRows[0].field1, 16.7);
});

test("PUT rejects dataset renames", async () => {
  await assert.rejects(
    () =>
      updateDataset(
        "42",
        {
          name: "Renamed dataset",
          timestampField: "Time",
          mappings: mappings.slice(0, 1),
          rows: [{ Time: "2026-04-29T01:25:15+10:00", AirTemperature: "16.7" }],
        },
        { sub: "user-id", role: "user" },
        {},
      ),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields.name === "Dataset name cannot be updated.",
  );
});

test("an import rejects more than the configured CSV row limit before database work", async () => {
  const rows = Array.from({ length: MAX_CSV_UPLOAD_ROWS + 1 }, () => ({
    Time: "2026-04-29T01:25:15+10:00",
    AirTemperature: "16.7",
  }));
  let repositoryCalled = false;

  await assert.rejects(
    () =>
      importDataset({
        name: "Too many rows",
        timestampField: "Time",
        mappings: mappings.slice(0, 1),
        rows,
      }, "user-id", {
        async createWithMappingsAndRows() {
          repositoryCalled = true;
        },
      }),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields.rows === `Provide no more than ${MAX_CSV_UPLOAD_ROWS.toLocaleString("en-AU")} CSV rows per upload.`,
  );
  assert.equal(repositoryCalled, false);
});

test("the configured CSV row limit itself remains valid", () => {
  const rows = Array.from({ length: MAX_CSV_UPLOAD_ROWS }, () => ({
    Time: "2026-04-29T01:25:15+10:00",
    AirTemperature: "16.7",
  }));

  assert.equal(
    validateImport({
      name: "Maximum rows",
      timestampField: "Time",
      mappings: mappings.slice(0, 1),
      rows,
    }).rows.length,
    MAX_CSV_UPLOAD_ROWS,
  );
});

test("an oversized JSON body returns the documented upload-limit response", () => {
  let statusCode;
  let responseBody;
  let nextCalled = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  uploadLimitErrorHandler(
    { type: "entity.too.large" },
    {},
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(MAX_CSV_UPLOAD_BYTES, 10 * 1024 * 1024);
  assert.equal(statusCode, 413);
  assert.deepEqual(responseBody, {
    error: {
      code: "UPLOAD_TOO_LARGE",
      message: `CSV upload requests must not exceed ${maxUploadSizeLabel}.`,
    },
  });
  assert.equal(nextCalled, false);
});
