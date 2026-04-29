import unittest
from alerts import generate_alerts, generate_alert


class TestGenerateAlerts(unittest.TestCase):
    """Tests for the main generate_alerts() function that works with the pipeline."""

    def test_high_alert_big_change(self):
        """Test that a large delta (>=0.3) triggers a HIGH alert."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.9,
                "current_corr": 0.5,
                "delta": 0.4
            }
        ]
        
        alerts = generate_alerts(changes, delta_threshold=0.3)
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "HIGH")
        self.assertEqual(alerts[0]["stream_1"], "sensor_A")
        self.assertEqual(alerts[0]["stream_2"], "sensor_B")
        self.assertEqual(alerts[0]["delta"], 0.4)

    def test_medium_alert_strong_to_weak(self):
        """Test that strong-to-weak drop triggers a MEDIUM alert."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.85,  # strong (>=0.7)
                "current_corr": 0.35,   # weak (<=0.4)
                "delta": 0.5
            }
        ]
        
        alerts = generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4)
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "MEDIUM")
        self.assertIn("Strong-to-weak drop", alerts[0]["reason"])

    def test_medium_alert_weak_to_strong(self):
        """Test that weak-to-strong rise triggers a MEDIUM alert."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.2,   # weak (<=0.4)
                "current_corr": 0.8,    # strong (>=0.7)
                "delta": 0.6
            }
        ]
        
        alerts = generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4)
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "MEDIUM")
        self.assertIn("Weak-to-strong rise", alerts[0]["reason"])

    def test_low_alert_small_change(self):
        """Test that a small change (0.1 to 0.3) triggers a LOW alert."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.6,
                "current_corr": 0.75,
                "delta": 0.15
            }
        ]
        
        alerts = generate_alerts(changes, delta_threshold=0.3)
        
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "LOW")

    def test_no_alert_very_small_change(self):
        """Test that a very small change (<0.1) triggers NO alert."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.6,
                "current_corr": 0.62,
                "delta": 0.02
            }
        ]
        
        alerts = generate_alerts(changes)
        
        self.assertEqual(len(alerts), 0)

    def test_multiple_changes_multiple_alerts(self):
        """Test that multiple changes produce multiple alerts."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "sensor_A",
                "stream_2": "sensor_B",
                "previous_corr": 0.9,
                "current_corr": 0.5,
                "delta": 0.4
            },
            {
                "window_index": 2,
                "start_time": "2024-01-01 01:00:00",
                "end_time": "2024-01-01 02:00:00",
                "stream_1": "sensor_C",
                "stream_2": "sensor_D",
                "previous_corr": 0.2,
                "current_corr": 0.75,
                "delta": 0.55
            }
        ]
        
        alerts = generate_alerts(changes, delta_threshold=0.3)
        
        self.assertEqual(len(alerts), 2)
        self.assertEqual(alerts[0]["stream_1"], "sensor_A")
        self.assertEqual(alerts[1]["stream_1"], "sensor_C")


class TestGenerateAlert(unittest.TestCase):
    """Tests for the simple generate_alert() function (backwards compatibility)."""

    def test_normal_no_alert(self):
        """Test delta_r < 0.3 gives no alert (normal status)."""
        result = generate_alert("sensor_1", 0.2)
        self.assertEqual(result["alert_level"], None)
        self.assertEqual(result["status"], "normal")
        self.assertEqual(result["sensor"], "sensor_1")

    def test_low_alert(self):
        """Test 0.3 <= delta_r < 0.5 gives LOW alert."""
        result = generate_alert("sensor_1", 0.4)
        self.assertEqual(result["alert_level"], "LOW")
        self.assertEqual(result["status"], "active")

    def test_medium_alert(self):
        """Test 0.5 <= delta_r < 0.7 gives MEDIUM alert."""
        result = generate_alert("sensor_1", 0.6)
        self.assertEqual(result["alert_level"], "MEDIUM")
        self.assertEqual(result["status"], "active")

    def test_high_alert(self):
        """Test delta_r >= 0.7 gives HIGH alert."""
        result = generate_alert("sensor_1", 0.8)
        self.assertEqual(result["alert_level"], "HIGH")
        self.assertEqual(result["status"], "active")


if __name__ == "__main__":
    unittest.main()