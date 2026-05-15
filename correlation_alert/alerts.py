"""
alerts.py - Generate structured alerts based on correlation changes.

This module takes the output from compare_correlation_changes() 
and generates alerts for significant changes in correlation between sensor streams.
"""

def generate_alerts(changes, delta_threshold_low=0.3, delta_threshold_medium=0.5, delta_threshold_high=0.7):
    """
    Generate alerts based on correlation changes between windows.

    Alert levels:
        - No alert: delta < 0.3
        - LOW: 0.3 <= delta < 0.5
        - MEDIUM: 0.5 <= delta < 0.7
        - HIGH: delta >= 0.7

    Parameters:
        changes (list[dict]): Output from compare_correlation_changes().
        delta_threshold_low (float): Threshold for LOW alert (default: 0.3).
        delta_threshold_medium (float): Threshold for MEDIUM alert (default: 0.5).
        delta_threshold_high (float): Threshold for HIGH alert (default: 0.7).

    Returns:
        list[dict]: List of alerts.
    """
    alerts = []
    
    for change in changes:
        delta = change["delta"]
        
        alert_level = None
        reason = None
        
        # Check 1: No alert for small changes
        if delta < delta_threshold_low:
            continue  # skip this change, no alert
        
        # Check 2: LOW alert
        elif delta_threshold_low <= delta < delta_threshold_medium:
            alert_level = "LOW"
            reason = f"Correlation changed by {delta:.2f} (LOW range: {delta_threshold_low} to {delta_threshold_medium})"
        
        # Check 3: MEDIUM alert
        elif delta_threshold_medium <= delta < delta_threshold_high:
            alert_level = "MEDIUM"
            reason = f"Correlation changed by {delta:.2f} (MEDIUM range: {delta_threshold_medium} to {delta_threshold_high})"
        
        # Check 4: HIGH alert
        else:  # delta >= delta_threshold_high
            alert_level = "HIGH"
            reason = f"Correlation changed by {delta:.2f} (HIGH range: >= {delta_threshold_high})"
        
        alerts.append(create_alert(change, alert_level, reason))
    
    return alerts


def create_alert(change, alert_level, reason):
    """
    Helper function to create a single alert dictionary.
    """
    return {
        "window_index": change["window_index"],
        "start_time": change["start_time"],
        "end_time": change["end_time"],
        "stream_1": change["stream_1"],
        "stream_2": change["stream_2"],
        "previous_corr": change["previous_corr"],
        "current_corr": change["current_corr"],
        "delta": change["delta"],
        "alert_level": alert_level,
        "reason": reason
    }


# Keep your original simple function for single sensor use if needed
def generate_alert(sensor, delta_r):
    """
    Simple alert for a single sensor (kept for backwards compatibility).
    """
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