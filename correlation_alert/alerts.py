"""
alerts.py - Generate structured alerts based on correlation changes.

This module takes the output from compare_correlation_changes() 
and generates alerts for significant changes in correlation between sensor streams.
"""

def generate_alerts(changes, strong_corr_threshold=0.7, weak_corr_threshold=0.4, delta_threshold=0.3):
    """
    Generate alerts based on correlation changes between windows.

    Parameters:
        changes (list[dict]): Output from compare_correlation_changes().
            Each item contains:
            {
                "window_index": int,
                "start_time": timestamp,
                "end_time": timestamp,
                "stream_1": str,
                "stream_2": str,
                "previous_corr": float,
                "current_corr": float,
                "delta": float
            }
        strong_corr_threshold (float): Threshold to define strong correlation (default: 0.7).
        weak_corr_threshold (float): Threshold to define weak correlation (default: 0.4).
        delta_threshold (float): Threshold for significant change (default: 0.3).

    Returns:
        list[dict]: List of alerts. Each alert contains:
            {
                "window_index": int,
                "start_time": timestamp,
                "end_time": timestamp,
                "stream_1": str,
                "stream_2": str,
                "previous_corr": float,
                "current_corr": float,
                "delta": float,
                "alert_level": str,
                "reason": str
            }
    """
    alerts = []
    
    for change in changes:
        delta = change["delta"]
        prev_corr = change["previous_corr"]
        current_corr = change["current_corr"]
        
        alert_level = None
        reason = None
        
        # CHECK 1: Did strong correlation become weak? (Most important)
        if prev_corr >= strong_corr_threshold and current_corr <= weak_corr_threshold:
            alert_level = "MEDIUM"
            reason = f"Strong-to-weak drop: correlation went from {prev_corr:.2f} to {current_corr:.2f}"
            alerts.append(create_alert(change, alert_level, reason))
            continue
        
        # CHECK 2: Did weak correlation become strong? (Also important)
        if prev_corr <= weak_corr_threshold and current_corr >= strong_corr_threshold:
            alert_level = "MEDIUM"
            reason = f"Weak-to-strong rise: correlation went from {prev_corr:.2f} to {current_corr:.2f}"
            alerts.append(create_alert(change, alert_level, reason))
            continue
        
        # CHECK 3: Is the change big enough? (HIGH alert)
        if delta >= delta_threshold:
            alert_level = "HIGH"
            reason = f"Correlation changed by {delta:.2f}, which is above threshold {delta_threshold}"
            alerts.append(create_alert(change, alert_level, reason))
            continue
        
        # CHECK 4: Small change but still worth noting (LOW alert)
        if 0.1 <= delta < delta_threshold:
            alert_level = "LOW"
            reason = f"Small but noticeable change of {delta:.2f}"
            alerts.append(create_alert(change, alert_level, reason))
    
    return alerts


def create_alert(change, alert_level, reason):
    """
    Helper function to create a single alert dictionary.
    
    Args:
        change (dict): A single change item from compare_correlation_changes()
        alert_level (str): LOW, MEDIUM, or HIGH
        reason (str): Description of why the alert was triggered
    
    Returns:
        dict: Formatted alert
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


# Keep my original simple function for single sensor use if needed
def generate_alert(sensor, delta_r):
    """
    Simple alert for a single sensor (kept for backwards compatibility).

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