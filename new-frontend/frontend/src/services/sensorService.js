import {
  sensor1Response,
  sensor2Response,
  sensor3Response,
  emptyResponse,
  validationErrorResponse,
  malformedSensorDataResponse,
  errorResponse,
  insufficientDataResponse,
} from '../data';

export const getSensorData = async (datasetId, options = {}) => {
  const {
    useMock = false,
    baseUrl = '/api',
  } = options;


  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    switch (datasetId) {
      case 'sensor1':
        return sensor1Response;

      case 'sensor2':
        return sensor2Response;

      case 'sensor3':
        return sensor3Response;

      case 'empty':
        return emptyResponse;

      case 'validation-error':
        return validationErrorResponse;

      case 'malformed':
        return malformedSensorDataResponse;

      case 'error':
        return errorResponse;

      case 'insufficient':
        return insufficientDataResponse;

      default:
        throw new Error(`Unknown dataset ID: ${datasetId}`);
    }
  }

  // LIVE BACKEND MODE
  

  if (!datasetId) {
    throw new Error('Dataset ID is required');
  }

  const response = await fetch(
    `${baseUrl}/datasets/${encodeURIComponent(datasetId)}/series`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch data: ${response.status} ${response.statusText}`
    );
  }

  const rows = await response.json();

  // Backend live endpoint currently returns
  // a flat array of sensor readings
  if (!Array.isArray(rows)) {
    throw new Error(
      'Invalid Backend response: expected an array of sensor readings'
    );
  }

  // ---------------------------------
  // EMPTY DATASET
  // ---------------------------------

  if (rows.length === 0) {
    return {
      dataset: datasetId,
      rowCount: 0,

      metadata: {
        streams: [],
      },

      rows: [],
    };
  }

  // ---------------------------------
  // FIND SENSOR STREAMS
  // ---------------------------------

  // These fields are metadata,
  // not actual sensor streams
  let streams = [];

  try {
    const datasetsResponse = await fetch(`${baseUrl}/datasets`);

    if (datasetsResponse.ok) {
      const datasets = await datasetsResponse.json();

      const dataset = datasets.find(
        (item) => item.name === datasetId
      );

      if (dataset) {
        const detailsResponse = await fetch(
          `${baseUrl}/datasets/${dataset.id}`
        );

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();

          if (Array.isArray(details.mappings)) {
            streams = details.mappings.map((mapping) => ({
              id: mapping.storageField,
              name:
                mapping.displayName ||
                mapping.name ||
                mapping.storageField,
            }));
          }
        }
      }
    }
  } catch (error) {
    console.warn(
      'Unable to load dataset stream mappings:',
      error
    );
  }

  if (streams.length === 0) {
    const excludedFields = new Set([
      'dataset_id',
      'created_at',
      'entry_id',
    ]);

    const streamIds = [
      ...new Set(
        rows.flatMap((row) =>
          Object.keys(row).filter(
            (key) =>
              !excludedFields.has(key) &&
              row[key] !== null &&
              row[key] !== undefined
          )
        )
      ),
    ];

    streams = streamIds.map((id) => ({
      id,
      name: id,
    }));
  }

  // ---------------------------------
  // NORMALISED FRONTEND RESPONSE
  // ---------------------------------

  return {
    dataset: datasetId,

    rowCount: rows.length,

    metadata: {
      streams,
    },

    rows,
  };
};