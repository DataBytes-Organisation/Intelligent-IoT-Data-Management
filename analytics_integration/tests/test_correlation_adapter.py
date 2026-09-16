import unittest
from analytics_integration.adapters.correlation_adapter import adapt_correlation_response

class TestCorrelationAdapter(unittest.TestCase):

    def setUp(self):
        self.valid_context = {
            "method": "Rolling_Pearson_Correlation",
            "window_size": 30,
            "step_size": 5
        }

    def test_returns_alert_list_with_tommy_fields(self):
        raw_payload = {
            "summary": {"total_windows_evaluated": 5},
            "alerts": [
                {
                    "window_index": 4,
                    "stream_1": "temperature",
                    "stream_2": "pressure",
                    "start_time": "2026-08-05T08:20:00Z",
                    "end_time": "2026-08-05T08:25:00Z",
                    "previous_corr": 0.91,
                    "current_corr": 0.12,
                    "delta": 0.79,
                    "alert_level": "HIGH",
                    "reason": "Correlation between temperature and pressure changed by 0.79."
                }
            ]
        }
        res = adapt_correlation_response(raw_payload, self.valid_context)
        self.assertIsInstance(res, list)
        self.assertEqual(len(res), 1)
        
        alert = res[0]
        self.assertEqual(alert["alert_type"], "CORRELATION_CHANGE")
        self.assertEqual(alert["target"]["metrics"], ["temperature", "pressure"])
        self.assertEqual(alert["timestamp"], "2026-08-05T08:25:00Z")
        self.assertEqual(alert["time_window"]["start"], "2026-08-05T08:20:00Z")
        self.assertEqual(alert["time_window"]["end"], "2026-08-05T08:25:00Z")
        self.assertEqual(alert["score"], 0.79)
        self.assertEqual(alert["severity"], "HIGH")
        self.assertEqual(alert["message"], "Correlation between temperature and pressure changed by 0.79.")
        self.assertEqual(alert["supporting_values"]["previous_correlation"], 0.91)
        self.assertEqual(alert["supporting_values"]["current_correlation"], 0.12)
        self.assertEqual(alert["supporting_values"]["delta"], 0.79)
        self.assertEqual(alert["supporting_values"]["window_index"], 4)

    def test_service_error_raises_exception(self):
        raw_error_payload = {"error": "Invalid time-series matrix length"}
        with self.assertRaises(RuntimeError) as ctx:
            adapt_correlation_response(raw_error_payload, self.valid_context)
        self.assertIn("CORRELATION_SERVICE_ERROR", str(ctx.exception))

    def test_missing_context_raises_value_error(self):
        raw_payload = {"alerts": []}
        with self.assertRaises(ValueError) as ctx:
            adapt_correlation_response(raw_payload, None)
        self.assertIn("MISSING_REQUEST_CONTEXT", str(ctx.exception))

if __name__ == "__main__":
    unittest.main()