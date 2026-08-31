/**
 * Unit Tests for Analytics Mapper Service
 */

const {
  buildCorrelationPayload,
  buildAnomalyPayload,
  parseCorrelationResponse,
  parseAnomalyResponse
} = require('../src/services/analyticsMapper');

describe('Analytics Mapper Unit Tests', () => {

  // --- Correlation Request Tests ---
  describe('buildCorrelationPayload', () => {
    test('transforms valid DB rows into correlation payload format', () => {
      const dbRows = [
        { created_at: '2026-08-04T10:00:00Z', field1: 411.9, field2: 7.7 },
        { created_at: '2026-08-04T10:01:00Z', field1: 412.3, field2: 7.8 }
      ];
      const result = buildCorrelationPayload(1, dbRows, ['field1', 'field2']);

      expect(result.dataset_id).toBe(1);
      expect(result.selected_streams).toEqual(['field1', 'field2']);
      expect(result.data.length).toBe(2);
      expect(result.data[0].field1).toBe(411.9);
    });

    test('handles empty DB rows gracefully with NO_DATA status', () => {
      const result = buildCorrelationPayload(1, [], ['field1']);
      expect(result.status).toBe('NO_DATA');
      expect(result.data).toEqual([]);
    });

    test('throws error if dataset_id or selected_streams are missing', () => {
      expect(() => buildCorrelationPayload(null, [], ['field1'])).toThrow();
      expect(() => buildCorrelationPayload(1, [], [])).toThrow();
    });
  });

  // --- Anomaly Request Tests ---
  describe('buildAnomalyPayload', () => {
    test('transforms DB rows into anomaly detector parameters', () => {
      const dbRows = [
        { created_at: '2026-08-04T10:00:00Z', field1: 411.9 },
        { created_at: '2026-08-04T10:01:00Z', field1: 412.3 }
      ];
      const result = buildAnomalyPayload(1, dbRows, 'field1', 'PcaADDetector');

      expect(result.dataset_id).toBe(1);
      expect(result.metric).toBe('field1');
      expect(result.timestamps).toHaveLength(2);
      expect(result.values).toEqual([411.9, 412.3]);
    });

    test('handles empty rows for anomaly payload', () => {
      const result = buildAnomalyPayload(1, [], 'field1');
      expect(result.status).toBe('NO_DATA');
      expect(result.timestamps).toEqual([]);
      expect(result.values).toEqual([]);
    });
  });

  // --- Response Parsing Tests ---
  describe('parseCorrelationResponse', () => {
    test('normalizes raw correlation output into alerts and analytics_results', () => {
      const rawPythonOutput = {
        summary: { processed_rows: 100 },
        alerts: [{
          stream_1: 'field1',
          stream_2: 'field2',
          alert_level: 'HIGH',
          previous_corr: 0.91,
          current_corr: 0.24,
          delta: -0.67,
          reason: 'Drop detected'
        }],
        correlations: [{
          stream_1: 'field1',
          stream_2: 'field2',
          correlation: 0.94,
          method: 'pearson'
        }]
      };

      const parsed = parseCorrelationResponse(rawPythonOutput, 1);
      expect(parsed.status).toBe('success');
      expect(parsed.alerts).toHaveLength(1);
      expect(parsed.alerts[0].severity).toBe('HIGH');
      expect(parsed.analytics_results[0].calculated_value).toBe(0.94);
    });

    test('handles null or empty correlation responses gracefully', () => {
      const parsed = parseCorrelationResponse(null, 1);
      expect(parsed.status).toBe('ERROR');
      expect(parsed.alerts).toEqual([]);
    });
  });

  describe('parseAnomalyResponse', () => {
    test('normalizes anomaly service response', () => {
      const rawResponse = {
        status: 'success',
        model_name: 'PcaADDetector',
        runtime_ms: 45,
        anomalies: [{ timestamp: '2026-08-04T10:01:00Z', score: 0.95, anomaly_flag: 1 }]
      };

      const parsed = parseAnomalyResponse(rawResponse, 1);
      expect(parsed.status).toBe('success');
      expect(parsed.anomalies[0].score).toBe(0.95);
    });
  });

});