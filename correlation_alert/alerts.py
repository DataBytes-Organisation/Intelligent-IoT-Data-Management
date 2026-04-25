"""
alerts.py
Generate structured alerts from correlation change data
"""

from threshold import get_alert_level


def validate_record(record):
    """
    Ensure each sensor record has required fields.
    """
    if not isinstance(record, dict):
        raise TypeError("Each sensor record must be a dictionary")

    if "sensor" not in record:
        raise ValueError("Missing 'sensor' field")

    if "delta_r" not in record:
        raise ValueError("Missing 'delta_r' field")


def build_alert(sensor, delta_r):
    """
    Build one alert record.
    """
    level = get_alert_level(delta_r)

    return {
        "sensor": sensor,
        "delta_r": delta_r,
        "level": level,
        "status": "alert" if level else "normal"
    }


def generate_alerts(sensor_data):
    """
    Convert list of sensor inputs into alert list.

    Example input:
    [
        {"sensor": "sensor1", "delta_r": 0.45}
    ]
    """

    if not isinstance(sensor_data, list):
        raise TypeError("sensor_data must be a list")

    alerts = []

    for record in sensor_data:
        validate_record(record)

        sensor = record["sensor"]
        delta_r = record["delta_r"]

        alerts.append(build_alert(sensor, delta_r))

    return alerts