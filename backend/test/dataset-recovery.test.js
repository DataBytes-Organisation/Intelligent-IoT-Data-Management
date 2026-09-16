const test = require('node:test');
const assert = require('node:assert/strict');

const datasetService = require('../src/services/datasetService');
const { restoreDataset } = require('../src/controllers/datasetsController');

const createResponse = () => ({
  statusCode: null,
  body: null,

  status(code) {
    this.statusCode = code;
    return this;
  },

  json(body) {
    this.body = body;
    return this;
  },
});

const createRequest = (
  id,
  user = { sub: 'user-123', role: 'user' }
) => ({
  params: { id },
  user,

  get(name) {
    if (name === 'x-request-id') {
      return 'test-request-id';
    }
    return undefined;
  },
});

test('restore dataset succeeds for an authorised user', async () => {
  const original = datasetService.restoreDataset;

  datasetService.restoreDataset = async (datasetId, user) => {
    assert.equal(datasetId, '12');
    assert.equal(user.sub, 'user-123');

    return {
      id: 12,
      name: 'Test Dataset',
      description: 'Test description',
      timestampField: 'timestamp',
      createdBy: 'user-123',
    };
  };

  try {
    const req = createRequest('12');
    const res = createResponse();

    await restoreDataset(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.id, 12);
    assert.equal(res.body.data.name, 'Test Dataset');
    assert.equal(res.body.meta.requestId, 'test-request-id');
  } finally {
    datasetService.restoreDataset = original;
  }
});

test('restore dataset rejects an expired recovery period', async () => {
  const original = datasetService.restoreDataset;

  datasetService.restoreDataset = async () => {
    const error = new Error('Dataset recovery period has expired.');
    error.code = 'RECOVERY_EXPIRED';
    error.status = 410;
    throw error;
  };

  try {
    const req = createRequest('12');
    const res = createResponse();

    await restoreDataset(req, res);

    assert.equal(res.statusCode, 410);
    assert.equal(res.body.error.code, 'RECOVERY_EXPIRED');
    assert.equal(
      res.body.error.message,
      'Dataset recovery period has expired.'
    );
  } finally {
    datasetService.restoreDataset = original;
  }
});

test('restore dataset rejects an unauthorised user', async () => {
  const original = datasetService.restoreDataset;

  datasetService.restoreDataset = async () => {
    const error = new Error('You cannot restore this dataset.');
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  };

  try {
    const req = createRequest('12', {
      sub: 'different-user',
      role: 'user',
    });
    const res = createResponse();

    await restoreDataset(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');
    assert.equal(
      res.body.error.message,
      'You cannot restore this dataset.'
    );
  } finally {
    datasetService.restoreDataset = original;
  }
});

test('restore dataset rejects an invalid dataset ID', async () => {
  const original = datasetService.restoreDataset;

  datasetService.restoreDataset = async () => {
    throw new Error('Service should not be called for an invalid ID.');
  };

  try {
    const req = createRequest('abc');
    const res = createResponse();

    await restoreDataset(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.body.error,
      'Dataset ID must be a positive integer'
    );
  } finally {
    datasetService.restoreDataset = original;
  }
});