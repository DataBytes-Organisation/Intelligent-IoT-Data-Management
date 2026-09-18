import numpy as np
import pandas as pd


TIME_FIELDS = ("start_time", "end_time")


def to_iso8601(value):
    """Serialize datetimes as UTC ISO 8601 and preserve numeric counters."""
    if value is None:
        return None

    if isinstance(value, (int, float, np.integer, np.floating)) and not isinstance(value, bool):
        if pd.isna(value):
            return None
        return value.item() if hasattr(value, "item") else value

    timestamp = pd.Timestamp(value)
    if pd.isna(timestamp):
        return None
    if timestamp.tzinfo is not None:
        timestamp = timestamp.tz_convert("UTC").tz_localize(None)
    return timestamp.isoformat() + "Z"


def with_iso_timestamps(records):
    """Return new records with API timestamp fields serialized."""
    return [
        {
            key: to_iso8601(value) if key in TIME_FIELDS else value
            for key, value in record.items()
        }
        for record in records
    ]


def serialize_correlation_results(correlation_results, precision=4):
    """Serialize correlation metadata and round matrices for output only."""
    return [
        {
            "window_index": item["window_index"],
            "start_time": to_iso8601(item["start_time"]),
            "end_time": to_iso8601(item["end_time"]),
            "window_size": item["window_size"],
            "correlation_matrix": item["correlation_matrix"].round(precision).to_dict(),
        }
        for item in correlation_results
    ]
