const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DISABLE_THINGSPEAK_POLLING = 'true';

const app = require('../src/server');

function startTestServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

test('active server exposes liveness health check', async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
    assert.equal(typeof body.uptimeSeconds, 'number');
  } finally {
    server.close();
  }
});

test('active server exposes readiness check instead of returning 404', async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/ready`);
    const body = await response.json();

    assert.ok([200, 503].includes(response.status));
    assert.ok(body.status);
  } finally {
    server.close();
  }
});

test('dataset series filter route is mounted and validates request body', async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/datasets/thingspeak-live/series/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'streamNames must be a non-empty array');
  } finally {
    server.close();
  }
});