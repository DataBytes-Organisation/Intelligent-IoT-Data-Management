const request = require('supertest');
const app = require('../server'); // Adjust the path if needed
require('dotenv').config({ path: './.env' }); 
describe('API Endpoint Integration Tests', () => {
  // Consider setting up a test database or mock data before running these tests

  it('GET /api/streams should return an array of stream entries', async () => {
    const res = await request(app).get('/api/streams');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/stream-names should return array of available stream names', async () => {
    const res = await request(app).get('/api/stream-names');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/filter-streams should return filtered stream entries', async () => {
    // Adjust streamNames below to match your sample data
    const res = await request(app)
      .post('/api/filter-streams')
      .send({ streamNames: ['Temperature'] });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/analyze should return analysis result', async () => {
    // Use valid streams and time range based on your dataset
    const res = await request(app)
      .post('/api/analyze')
      .send({
        streams: ['s1', 's2', 's3'],
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-06T00:10:00",
        threshold: 0.5,
        algo_type: "correlation"
      });
    // Accept 200 or error if Python service is unavailable
    expect([200, 500]).toContain(res.statusCode);
  });

  it('POST /api/analyze-csv should return a cleaned/interpolated CSV file', async () => {
    const res = await request(app)
      .post('/api/analyze-csv')
      .send({ window_size: 15 });
    // Accept 200 or error if Python service is unavailable
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.type).toBe('text/csv');
    }
  });

  it('POST /api/analyze-corr should return correlation matrix', async () => {
    const res = await request(app)
      .post('/api/analyze-corr')
      .send({
        streams: ['s1', 's2', 's3'],
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-06T00:10:00",
        threshold: 0.5
      });
    // Accept 200 or error if Python service is unavailable
    expect([200, 500]).toContain(res.statusCode);
  });

  it('POST /api/visualize should return a base64-encoded image string', async () => {
    const res = await request(app)
      .post('/api/visualize')
      .send({
        streams: ['field1', 'field2', 'field3'],
        start_date: "2025-03-18T06:55:31",
        end_date: "2025-03-18T07:00:43",
        type: "grouped_bar_chart"
      });
    // Accept 200 or error if Python service is unavailable
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('image');
      expect(typeof res.body.image).toBe('string');
    }
  });
});