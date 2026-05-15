"""
test_alerts.py - Unit tests for the alerts module.
Tests the updated threshold ranges: LOW (0.3-0.5), MEDIUM (0.5-0.7), HIGH (>=0.7)
"""

import unittest
from alerts import generate_alerts, generate_alert


class TestGenerateAlerts(unittest.TestCase):
    """Tests for the main generate_alerts() function."""

    def test_no_alert_below_03(self):
        """Delta < 0.3 should give NO alert."""
        changes = [{
            "window_index": 1,
            "start_time": "2024-01-01 00:00:00",
            "end_time": "2024-01-01 01:00:00",
            "stream_1": "sensor_A",
            "stream_2": "sensor_B",
            "previous_corr": 0.9,
            "current_corr": 0.85,
            "delta": 0.05
        }]
        alerts = generate_alerts(changes)
        self.assertEqual(len(alerts), 0)

    def test_low_alert_03_to_05(self):
        """0.3 <= delta < 0.5 should give LOW alert."""
        changes = [{
            "window_index": 1,
            "start_time": "2024-01-01 00:00:00",
            "end_time": "2024-01-01 01:00:00",
            "stream_1": "sensor_A",
            "stream_2": "sensor_B",
            "previous_corr": 0.9,
            "current_corr": 0.6,
            "delta": 0.3
        }]
        alerts = generate_alerts(changes)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "LOW")

    def test_medium_alert_05_to_07(self):
        """0.5 <= delta < 0.7 should give MEDIUM alert."""
        changes = [{
            "window_index": 1,
            "start_time": "2024-01-01 00:00:00",
            "end_time": "2024-01-01 01:00:00",
            "stream_1": "sensor_A",
            "stream_2": "sensor_B",
            "previous_corr": 0.9,
            "current_corr": 0.3,
            "delta": 0.6
        }]
        alerts = generate_alerts(changes)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "MEDIUM")

    def test_high_alert_above_07(self):
        """Delta >= 0.7 should give HIGH alert."""
        changes = [{
            "window_index": 1,
            "start_time": "2024-01-01 00:00:00",
            "end_time": "2024-01-01 01:00:00",
            "stream_1": "sensor_A",
            "stream_2": "sensor_B",
            "previous_corr": 0.9,
            "current_corr": 0.1,
            "delta": 0.8
        }]
        alerts = generate_alerts(changes)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_level"], "HIGH")

    def test_multiple_changes_different_levels(self):
        """Test multiple changes with different alert levels."""
        changes = [
            {
                "window_index": 1,
                "start_time": "2024-01-01 00:00:00",
                "end_time": "2024-01-01 01:00:00",
                "stream_1": "A",
                "stream_2": "B",
                "previous_corr": 0.9,
                "current_corr": 0.6,
                "delta": 0.3  # LOW
            },
            {
                "window_index": 2,
                "start_time": "2024-01-01 01:00:00",
                "end_time": "2024-01-01 02:00:00",
                "stream_1": "C",
                "stream_2": "D",
                "previous_corr": 0.9,
                "current_corr": 0.3,
                "delta": 0.6  # MEDIUM
            },
            {
                "window_index": 3,
                "start_time": "2024-01-01 02:00:00",
                "end_time": "2024-01-01 03:00:00",
                "stream_1": "E",
                "stream_2": "F",
                "previous_corr": 0.9,
                "current_corr": 0.1,
                "delta": 0.8  # HIGH
            }
        ]
        alerts = generate_alerts(changes)
        self.assertEqual(len(alerts), 3)
        self.assertEqual(alerts[0]["alert_level"], "LOW")
        self.assertEqual(alerts[1]["alert_level"], "MEDIUM")
        self.assertEqual(alerts[2]["alert_level"], "HIGH")


class TestGenerateAlert(unittest.TestCase):
    """Tests for the simple generate_alert() function."""

    def test_normal_no_alert(self):
        result = generate_alert("sensor_1", 0.2)
        self.assertEqual(result["alert_level"], None)
        self.assertEqual(result["status"], "normal")

    def test_low_alert(self):
        result = generate_alert("sensor_1", 0.4)
        self.assertEqual(result["alert_level"], "LOW")
        self.assertEqual(result["status"], "active")

    def test_medium_alert(self):
        result = generate_alert("sensor_1", 0.6)
        self.assertEqual(result["alert_level"], "MEDIUM")
        self.assertEqual(result["status"], "active")

    def test_high_alert(self):
        result = generate_alert("sensor_1", 0.8)
        self.assertEqual(result["alert_level"], "HIGH")
        self.assertEqual(result["status"], "active")


if __name__ == "__main__":
    unittest.main()