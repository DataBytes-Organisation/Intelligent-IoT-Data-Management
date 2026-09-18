const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const app = require('../src/app');
const db = require('../src/db/pool');
const datasetRepository = require('../src/repositories/datasetRepository');
const timeseriesService = require('../src/services/timeseriesService');
const {
  buildAnalyticsPayload,
  normaliseRows,
} = require('../src/services/analyseService');
const { ensureThingSpeakDataset } = require('../src/services/thingspeakService');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('1350261 ThingSpeak rows use the documented canonical metric names', () => {
  assert.deepEqual(
    normaliseRows([
      {
        created_at: '2026-08-27T00:00:00Z',
        field1: 650,
        field2: 120,
        field3: 21.5,
        field4: 1008.2,
        field5: 48.3,
        field6: 21.7,
        field7: 35.1,
        field8: 723,
      },
    ], 'thingspeak-1350261'),
    [{
      timestamp: '2026-08-27T00:00:00.000Z',
      eco2: 650,
      etvoc: 120,
      temperature: 21.5,
      air_pressure: 1008.2,
      humidity: 48.3,
      temperature_secondary: 21.7,
      controller_temperature: 35.1,
      conductance: 723,
    }],
  );
});

test('uploaded dataset selections and stored values use sourceField names', async () => {
  const originalFindMappings = datasetRepository.findMappingsByName;
  datasetRepository.findMappingsByName = async () => [
    { storageField: 'field1', sourceField: 'AirTemperature' },
    { storageField: 'field2', sourceField: 'RelativeHumidity' },
  ];

  try {
    const payload = await buildAnalyticsPayload(
      {
        dataset: 'microclimate-april',
        model: { metric: 'field1' },
        correlation: { streams: ['field1', 'field2'] },
      },
      [{
        created_at: '2026-04-28T15:25:15.000Z',
        entry_id: 1,
        field1: 16.7,
        field2: null,
      }],
    );

    assert.deepEqual(payload, {
      entity_id: 'microclimate-april',
      timestamp_col: 'timestamp',
      data: [{
        timestamp: '2026-04-28T15:25:15.000Z',
        AirTemperature: 16.7,
        RelativeHumidity: null,
      }],
      model: { detector: 'isolationforest', metric: 'AirTemperature', parameters: {} },
      correlation: {
        streams: ['AirTemperature', 'RelativeHumidity'],
        window_size: 20,
        step_size: 10,
        method: 'pearson',
      },
    });
  } finally {
    datasetRepository.findMappingsByName = originalFindMappings;
  }
});

test('dataset-first analysis rejects a selected stream with no mapping', async () => {
  const originalFindMappings = datasetRepository.findMappingsByName;
  datasetRepository.findMappingsByName = async () => [
    { storageField: 'field1', sourceField: 'AirTemperature' },
  ];

  try {
    await assert.rejects(
      () => buildAnalyticsPayload(
        {
          dataset: 'microclimate-april',
          model: { metric: 'field8' },
          correlation: { streams: ['field1', 'field8'] },
        },
        [{ created_at: '2026-04-28T15:25:15.000Z', entry_id: 1, field1: 16.7 }],
      ),
      (error) => error.code === 'ANALYTICS_METRIC_UNMAPPED' && error.status === 400,
    );
  } finally {
    datasetRepository.findMappingsByName = originalFindMappings;
  }
});

test('ThingSpeak live dataset is seeded with configured channel mappings', async () => {
  const originalQuery = db.query;
  const originalEnsureMappings = datasetRepository.ensureSystemMappings;
  const originalOwnerId = process.env.THINGSPEAK_DATASET_OWNER_ID;

  process.env.THINGSPEAK_DATASET_OWNER_ID = 'thingspeak-owner-uuid';

  let receivedMappings;

  db.query = async (query, values) => {
    if (query.includes('SELECT id FROM auth_users')) {
      assert.deepEqual(values, ['thingspeak-owner-uuid']);

      return {
        rows: [
          {
            id: 'thingspeak-owner-uuid',
          },
        ],
      };
    }

    if (query.includes('INSERT INTO datasets')) {
      assert.deepEqual(values, [
        'thingspeak-live',
        'thingspeak-owner-uuid',
      ]);

      return {
        rows: [
          {
            id: 42,
          },
        ],
      };
    }

    throw new Error(`Unexpected SQL: ${query}`);
  };

  datasetRepository.ensureSystemMappings = async (
    datasetId,
    mappings,
  ) => {
    assert.equal(datasetId, 42);
    receivedMappings = mappings;
  };

  try {
    const dataset = await ensureThingSpeakDataset('1350261');

    assert.equal(dataset.id, 42);

    assert.deepEqual(
      receivedMappings.map(
        ({ storageField, sourceField }) => ({
          storageField,
          sourceField,
        }),
      ),
      [
        { storageField: 'field1', sourceField: 'eco2' },
        { storageField: 'field2', sourceField: 'etvoc' },
        { storageField: 'field3', sourceField: 'temperature' },
        { storageField: 'field4', sourceField: 'air_pressure' },
        { storageField: 'field5', sourceField: 'humidity' },
        {
          storageField: 'field6',
          sourceField: 'temperature_secondary',
        },
        {
          storageField: 'field7',
          sourceField: 'controller_temperature',
        },
        { storageField: 'field8', sourceField: 'conductance' },
      ],
    );
  } finally {
    db.query = originalQuery;
    datasetRepository.ensureSystemMappings = originalEnsureMappings;

    if (originalOwnerId === undefined) {
      delete process.env.THINGSPEAK_DATASET_OWNER_ID;
    } else {
      process.env.THINGSPEAK_DATASET_OWNER_ID = originalOwnerId;
    }
  }
});

test('POST /api/analyse normalises Backend data and returns the AIntl response', async () => {
  let receivedPayload;
  const analyticsServer = http.createServer((req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/analytics/analyze');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      receivedPayload = JSON.parse(body);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        generated_at: '2026-08-27T00:00:00.000Z',
        alerts: [],
        summary: { processed_items: 2, alert_count: 0 },
        errors: [],
      }));
    });
  });
  const analyticsPort = await listen(analyticsServer);
  const backendServer = http.createServer(app);
  const backendPort = await listen(backendServer);
  const originalUrl = process.env.ANALYTICS_SERVICE_URL;
  const originalSeriesLoader = timeseriesService.getWideEntriesForDatasetName;
  process.env.ANALYTICS_SERVICE_URL = `http://127.0.0.1:${analyticsPort}`;
  timeseriesService.getWideEntriesForDatasetName = async () => [
    { created_at: '2026-08-27T00:00:00.000Z', entry_id: 1, field3: '50.5', field4: '24.2', field6: '29.91' },
    { created_at: '2026-08-27T00:01:00.000Z', entry_id: 2, field3: '51.0', field4: '24.4', field6: '29.92' },
  ];

  try {
    const response = await fetch(`http://127.0.0.1:${backendPort}/api/analyse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dataset: 'thingspeak-12397',
        model: { metric: 'temperature' },
        correlation: { streams: ['temperature', 'humidity'] },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.summary.processed_items, 2);
    assert.deepEqual(receivedPayload, {
      entity_id: 'thingspeak-12397',
      timestamp_col: 'timestamp',
      data: [
        { timestamp: '2026-08-27T00:00:00.000Z', humidity: 50.5, temperature: 24.2, pressure: 1012.8692490000001 },
        { timestamp: '2026-08-27T00:01:00.000Z', humidity: 51, temperature: 24.4, pressure: 1013.2078880000001 },
      ],
      model: { detector: 'isolationforest', metric: 'temperature', parameters: {} },
      correlation: { streams: ['temperature', 'humidity'], window_size: 20, step_size: 10, method: 'pearson' },
    });
  } finally {
    timeseriesService.getWideEntriesForDatasetName = originalSeriesLoader;
    if (originalUrl === undefined) delete process.env.ANALYTICS_SERVICE_URL;
    else process.env.ANALYTICS_SERVICE_URL = originalUrl;
    await close(backendServer);
    await close(analyticsServer);
  }
});

test('POST /api/analyse returns an actionable unavailable error when AIntl cannot be reached', async () => {
  const backendServer = http.createServer(app);
  const backendPort = await listen(backendServer);
  const originalUrl = process.env.ANALYTICS_SERVICE_URL;
  process.env.ANALYTICS_SERVICE_URL = 'http://127.0.0.1:1';

  try {
    const response = await fetch(`http://127.0.0.1:${backendPort}/api/analyse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        data: [
          { timestamp: '2026-08-27T00:00:00.000Z', temperature: 24.2, humidity: 50.5 },
          { timestamp: '2026-08-27T00:01:00.000Z', temperature: 24.4, humidity: 51.0 },
        ],
        model: { metric: 'temperature' },
        correlation: { streams: ['temperature', 'humidity'] },
      }),
    });

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: 'Analytics service is unavailable',
      code: 'ANALYTICS_UNAVAILABLE',
    });
  } finally {
    if (originalUrl === undefined) delete process.env.ANALYTICS_SERVICE_URL;
    else process.env.ANALYTICS_SERVICE_URL = originalUrl;
    await close(backendServer);
  }
});
