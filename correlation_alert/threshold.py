"""
threshold.py
Alert classification logic for correlation change (Δr)
"""

from numbers import Real


LOW_THRESHOLD = 0.30
MEDIUM_THRESHOLD = 0.50
HIGH_THRESHOLD = 0.80


def validate_delta_r(delta_r):
    """
    Validate numeric delta_r input.
    """
    if not isinstance(delta_r, Real):
        raise TypeError("delta_r must be numeric")


def get_alert_level(delta_r):
    """
    Return alert level based on Δr:

    <0.30       -> None
    0.30-<0.50  -> LOW
    0.50-<0.80  -> MEDIUM
    >=0.80      -> HIGH
    """

    validate_delta_r(delta_r)

    if delta_r < LOW_THRESHOLD:
        return None
    elif delta_r < MEDIUM_THRESHOLD:
        return "LOW"
    elif delta_r < HIGH_THRESHOLD:
        return "MEDIUM"
    return "HIGH"