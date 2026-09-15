const ALLOWED_STORAGE_FIELDS = new Set([
  "field1",
  "field2",
  "field3",
  "field4",
  "field5",
  "field6",
  "field7",
  "field8",
]);

class DatasetImportError extends Error {
  constructor(message, fields) {
    super(message);
    this.code = "VALIDATION_ERROR";
    this.status = 400;
    this.fields = fields;
  }
}

const validationError = (fields) =>
  new DatasetImportError("One or more fields are invalid.", fields);

const text = (value) => (typeof value === "string" ? value.trim() : "");
const isBlank = (value) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

function validateMappings(mappings, timestampField = "") {
  const fields = {};
  if (!Array.isArray(mappings) || mappings.length < 1 || mappings.length > 8)
    throw validationError({ mappings: "Provide one to eight sensor mappings." });
  const sourceFields = new Set();
  const storageFields = new Set();
  const normalisedMappings = mappings.map((mapping, index) => {
    const sourceField = text(mapping?.sourceField);
    const storageField = text(mapping?.storageField);
    const displayName = text(mapping?.displayName);
    const sourceDataType = text(mapping?.sourceDataType);
    if (!sourceField) fields[`mappings.${index}.sourceField`] = "Required.";
    if (!ALLOWED_STORAGE_FIELDS.has(storageField))
      fields[`mappings.${index}.storageField`] = "Use field1 through field8.";
    if (!displayName || displayName.length > 120)
      fields[`mappings.${index}.displayName`] = "Required; maximum 120 characters.";
    if (sourceDataType !== "number")
      fields[`mappings.${index}.sourceDataType`] = "Must be number for field1 through field8.";
    if (sourceFields.has(sourceField))
      fields[`mappings.${index}.sourceField`] = "Each source field may be mapped once.";
    if (sourceField === timestampField)
      fields[`mappings.${index}.sourceField`] = "The timestamp field cannot also be a sensor mapping.";
    if (storageFields.has(storageField))
      fields[`mappings.${index}.storageField`] = "Each storage field may be mapped once.";
    sourceFields.add(sourceField);
    storageFields.add(storageField);
    return { sourceField, storageField, displayName, sourceDataType };
  });
  if (Object.keys(fields).length) throw validationError(fields);
  return normalisedMappings;
}

function validateImport(input, { requireName = true } = {}) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const fields = {};
  const name = text(input.name);
  const descriptionProvided = Object.hasOwn(input, "description");
  const description = descriptionProvided ? text(input.description) : undefined;
  const timestampField = text(input.timestampField);
  const mappings = input.mappings;
  const rows = Array.isArray(input.rows) ? input.rows : null;

  if (requireName && (!name || name.length > 120))
    fields.name = "Enter a dataset name of at most 120 characters.";
  if (descriptionProvided && (typeof input.description !== "string" || description.length > 1000))
    fields.description = "Must be a string of at most 1000 characters.";
  if (!timestampField) fields.timestampField = "Select one CSV timestamp column.";
  if (!rows || rows.length < 1)
    fields.rows = "Provide one or more CSV rows.";

  if (Object.keys(fields).length) throw validationError(fields);
  return {
    name,
    description,
    timestampField,
    mappings: validateMappings(mappings, timestampField),
    rows,
  };
}

function mapRows(rows, timestampField, mappings) {
  return rows.map((row, index) => {
    if (!row || Array.isArray(row) || typeof row !== "object")
      throw validationError({
        [`rows.${index}`]: "Each row must be an object keyed by CSV header.",
      });
    const rawTimestamp = row[timestampField];
    const timestamp = new Date(rawTimestamp);
    if (rawTimestamp === undefined || rawTimestamp === null || Number.isNaN(timestamp.getTime()))
      throw validationError({
        [`rows.${index}.${timestampField}`]: "Must be a valid timestamp.",
      });
    const output = { entryId: index + 1, createdAt: timestamp.toISOString() };
    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceField];
      if (isBlank(rawValue)) {
        output[mapping.storageField] = null;
        continue;
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value))
        throw validationError({
          [`rows.${index}.${mapping.sourceField}`]: "Must be a number or an empty value.",
        });
      output[mapping.storageField] = value;
    }
    return output;
  });
}

async function importDataset(input, userId, repository) {
  const parsed = validateImport(input);
  const wideRows = mapRows(parsed.rows, parsed.timestampField, parsed.mappings);
  return repository.createWithMappingsAndRows({ ...parsed, wideRows, userId });
}

async function updateDataset(datasetId, input, user, repository) {
  if (!Number.isInteger(Number(datasetId)) || Number(datasetId) < 1)
    throw validationError({ id: "Must be a positive integer." });
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  if (Object.hasOwn(input, "name"))
    throw validationError({ name: "Dataset name cannot be updated." });
  const parsed = validateImport(input, { requireName: false });
  return repository.replaceMappingsAndAddRows(Number(datasetId), {
    ...parsed,
    wideRows: mapRows(parsed.rows, parsed.timestampField, parsed.mappings),
    user,
  });
}

module.exports = {
  DatasetImportError,
  importDataset,
  updateDataset,
  validateImport,
  mapRows,
};
