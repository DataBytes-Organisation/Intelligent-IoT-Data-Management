"""
alerts.py - Generate structured alerts based on Δr threshold.
This module currently implements the threshold logic directly.
Later it will be replaced by importing Tarun's function from threshold.py.
"""

def generate_alert(sensor, delta_r):
    """
    Create an alert dictionary for a given sensor and Δr value.

    Args:
        sensor (str): Identifier of the sensor.
        delta_r (float): Change in correlation value.

    Returns:
        dict: {
            'sensor': str,
            'delta_r': float,
            'alert_level': str or None,
            'status': str
        }
    """
    # Determine alert level based on threshold rules
    if delta_r < 0.3:
        alert_level = None
        status = "normal"
    elif delta_r < 0.5:
        alert_level = "LOW"
        status = "active"
    elif delta_r < 0.7:
        alert_level = "MEDIUM"
        status = "active"
    else:
        alert_level = "HIGH"
        status = "active"

    return {
        'sensor': sensor,
        'delta_r': delta_r,
        'alert_level': alert_level,
        'status': status
    }

