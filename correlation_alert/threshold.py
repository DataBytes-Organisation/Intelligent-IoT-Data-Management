def get_alert_level(delta_r):
    
    """

    Returns alert level based on change in correlation (delta_r)

    """

    if delta_r is None:
        return None

    if delta_r < 0.3:
        return None
    elif delta_r < 0.5:
        return "LOW"
    elif delta_r < 0.7:
        return "MEDIUM"
    else:
        return "HIGH"