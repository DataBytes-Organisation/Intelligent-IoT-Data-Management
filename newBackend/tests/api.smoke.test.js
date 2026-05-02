const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../BackendCode/app');

let server;
let baseUrl;

test.before(() => {
  server = app.listen(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(() => {
  server.close();
});

test('GET / returns backend status text', async () => {
  const response = await fetch(`${baseUrl}/`);
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.equal(text, 'Backend is running');
});

test('GET /health returns service health payload', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.timestamp, 'string');
  assert.equal(typeof body.uptimeSeconds, 'number');
});

test('GET /api/stream-names returns non-empty stream array', async () => {
  const response = await fetch(`${baseUrl}/api/stream-names`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);
});

test('POST /api/filter-streams rejects invalid payload', async () => {
  const response = await fetch(`${baseUrl}/api/filter-streams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamNames: [] })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /non-empty array/i);
});
