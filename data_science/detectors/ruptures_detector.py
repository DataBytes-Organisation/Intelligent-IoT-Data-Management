"""Windowed mean-shift detection for the Models runner and live data batches."""
from numbers import Real
from time import perf_counter

import numpy as np
import pandas as pd
import ruptures as rpt

from data_science.input_validator import InputValidationError, validate_input


DEFAULT_WINDOW_SIZE = 60
DEFAULT_STEP_SIZE = 10


class RupturesDetector:
    name = "RupturesPELT"

    def __init__(self, window_size=DEFAULT_WINDOW_SIZE, step_size=DEFAULT_STEP_SIZE,
                 penalty=10.0, sensor_cols=None):
        if type(window_size) is not int or window_size < 4:
            raise ValueError("window_size must be an integer of at least 4")
        if type(step_size) is not int or not 1 <= step_size <= window_size:
            raise ValueError("step_size must be an integer between 1 and window_size")
        if isinstance(penalty, bool) or not isinstance(penalty, Real) or not np.isfinite(penalty) or penalty <= 0:
            raise ValueError("penalty must be a positive finite number")
        if sensor_cols is not None:
            if not isinstance(sensor_cols, (list, tuple)) or not sensor_cols:
                raise ValueError("sensor_cols must be a nonempty list of sensor names")
            if any(not isinstance(name, str) or not name for name in sensor_cols):
                raise ValueError("sensor names must be nonempty strings")
            if len(set(sensor_cols)) != len(sensor_cols):
                raise ValueError("sensor_cols contains duplicate names")
        self.window_size = window_size
        self.step_size = step_size
        self.penalty = penalty
        self._schema = None if sensor_cols is None else tuple(sensor_cols)
        self._pending = None
        self._last_time = None

    def _prepare(self, frame, schema, live):
        if isinstance(frame, pd.DataFrame):
            if not frame.columns.is_unique:
                raise InputValidationError("Duplicate input column names")
            if live and not isinstance(frame.index, pd.DatetimeIndex) and "timestamp" not in frame:
                raise InputValidationError("Live data requires a timestamp column or DatetimeIndex")
        clean = validate_input(frame)
        if clean.index.hasnans:
            raise InputValidationError("Missing timestamp")
        if schema is not None:
            if set(clean.columns) != set(schema):
                raise InputValidationError(f"Expected sensor columns {list(schema)}, received {list(clean.columns)}")
            clean = clean.loc[:, list(schema)]
        if any(dtype.kind not in "iuf" for dtype in clean.dtypes):
            raise InputValidationError("Sensor columns must contain real integer or floating-point values")
        if not np.isfinite(clean.to_numpy(dtype=float)).all():
            raise InputValidationError("Sensor columns must contain finite values")
        return clean

    def _windows(self, clean):
        values = clean.to_numpy(dtype=float)
        for start in range(0, len(clean) - self.window_size + 1, self.step_size):
            stop = start + self.window_size
            algorithm = rpt.Pelt(model="l2", min_size=2, jump=1).fit(values[start:stop])
            points = [start + i for i in algorithm.predict(pen=self.penalty) if i < self.window_size]
            yield start, stop, points

    def detect(self, dataframe):
        """Batch runner interface. Scores count full windows voting for each timestamp."""
        started = perf_counter()
        clean = self._prepare(dataframe, self._schema, live=False)
        scores = pd.Series(0.0, index=clean.index)
        for _, _, points in self._windows(clean):
            scores.iloc[points] += 1
        return dict(model_name=self.name, timestamp=clean.index, score=scores,
                    anomaly_flag=scores.gt(0), runtime=perf_counter() - started,
                    metrics=list(clean.columns))

    def update(self, dataframe):
        """Submit a live batch to one persistent stream instance. Return completed windows."""
        clean = self._prepare(dataframe, self._schema, live=True)
        if self._last_time is not None:
            if (clean.index.tz is None) != (self._last_time.tz is None):
                raise InputValidationError("Stream timezone awareness changed")
            if clean.index.tz is not None:
                clean = clean.tz_convert(self._last_time.tz)
            if clean.index[0] <= self._last_time:
                raise InputValidationError("New timestamps must follow the last accepted batch")
        combined = clean if self._pending is None else pd.concat([self._pending, clean])
        events = []
        next_start = 0
        for start, stop, points in self._windows(combined):
            events.append(dict(window_start=combined.index[start], window_end=combined.index[stop - 1],
                               change_points=combined.index.take(points).tolist()))
            next_start = start + self.step_size
        self._pending = combined.iloc[next_start:].copy()
        self._schema = tuple(clean.columns)
        self._last_time = clean.index[-1]
        return events
