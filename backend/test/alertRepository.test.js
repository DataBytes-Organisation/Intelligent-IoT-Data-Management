/**
 * Persistence & Retrieval Unit Tests for Alerts and Analytics
 */
const alertRepo = require('../src/db/alertRepository');
const pool = require('../src/db/pool');

// Mock pool.query for isolated unit testing
jest.mock('../src/db/pool', () => ({
  query: jest.fn()
}));

describe('Alert Repository & Persistence Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('saveAlerts inserts records and returns saved rows', async () => {
    const mockAlerts = [{
      dataset_id: 1,
      entity: 'field1_vs_field2',
      rule_name: 'Correlation_Change',
      severity: 'HIGH',
      previous_corr: 0.95,
      current_corr: 0.20,
      delta: -0.75,
      reason: 'Significant correlation drop',
      triggered_at: '2026-08-05T12:00:00Z'
    }];

    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...mockAlerts[0] }] });

    const result = await alertRepo.saveAlerts(mockAlerts);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('HIGH');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('saveAlerts returns empty array when given no input', async () => {
    const result = await alertRepo.saveAlerts([]);
    expect(result).toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('saveAnalyticsResults inserts computational metrics', async () => {
    const mockResults = [{
      dataset_id: 1,
      metric_type: 'pearson_correlation',
      calculated_value: 0.85,
      window_start: '2026-08-05T12:00:00Z',
      window_end: '2026-08-05T12:20:00Z',
      metadata: { stream_1: 'field1', stream_2: 'field2' }
    }];

    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...mockResults[0] }] });

    const result = await alertRepo.saveAnalyticsResults(mockResults);
    expect(result).toHaveLength(1);
    expect(result[0].calculated_value).toBe(0.85);
  });

  test('getLatestAlerts queries latest triggered alerts', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 2, dataset_id: 1, severity: 'HIGH', triggered_at: '2026-08-05T12:10:00Z' },
        { id: 1, dataset_id: 1, severity: 'MEDIUM', triggered_at: '2026-08-05T12:00:00Z' }
      ]
    });

    const result = await alertRepo.getLatestAlerts(1, 10);
    expect(result).toHaveLength(2);
    expect(result[0].severity).toBe('HIGH');
  });

  test('getAlertHistory queries historical records with pagination filters', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, dataset_id: 1, severity: 'HIGH', triggered_at: '2026-08-05T12:00:00Z' }]
    });

    const result = await alertRepo.getAlertHistory(1, 'HIGH', 10, 0);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('HIGH');
  });
});