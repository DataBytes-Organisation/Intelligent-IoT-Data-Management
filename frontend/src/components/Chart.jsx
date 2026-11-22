import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getChartColor } from "../utils/chartColors.js";

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
};

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const calculateStreamStats = (data, stream) => {
  const values = data
    .map((row) => Number(row[stream]))
    .filter(Number.isFinite);

  if (values.length === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
    };
  }

  const mean =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum + Math.pow(value - mean, 2),
      0
    ) / values.length;

  return {
    mean,
    standardDeviation: Math.sqrt(variance),
  };
};

const getAlertMetrics = (alert) => {
  if (Array.isArray(alert?.target?.metrics)) {
    return alert.target.metrics;
  }

  if (typeof alert?.target === 'string') {
    return [alert.target];
  }

  if (Array.isArray(alert?.target)) {
    return alert.target;
  }

  if (typeof alert?.metric === 'string') {
    return [alert.metric];
  }

  return [];
};

const findMatchingStream = (
  alert,
  selectedStreams,
  streamLabels
) => {
  const metrics = getAlertMetrics(alert);

  for (const metric of metrics) {
    const normalizedMetric = normalizeText(metric);

    const stream = selectedStreams.find((streamId) => {
      const id = normalizeText(streamId);

      const displayName = normalizeText(
        streamLabels[streamId]
      );

      return (
        normalizedMetric === id ||
        normalizedMetric === displayName
      );
    });

    if (stream) {
      return stream;
    }
  }

  return null;
};

const getRawAlertValue = (
  alert,
  stream,
  streamLabels
) => {
  const supportingValues = alert?.supporting_values;

  if (
    !supportingValues ||
    typeof supportingValues !== 'object'
  ) {
    return null;
  }

  if (
    Number.isFinite(
      Number(supportingValues.sensor_value)
    )
  ) {
    return Number(
      supportingValues.sensor_value
    );
  }

  const possibleNames = [
    normalizeText(stream),
    normalizeText(streamLabels[stream]),
  ];

  for (const [key, value] of Object.entries(
    supportingValues
  )) {
    if (
      possibleNames.includes(
        normalizeText(key)
      ) &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
};

const TimelineTooltip = ({
  active,
  payload,
  label,
  streamLabels,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0]?.payload;

  const anomalyEntry = payload.find(
    (item) =>
      row?.[`__alert_${item.dataKey}`]
  );

  if (anomalyEntry) {
    const stream = anomalyEntry.dataKey;

    const alert =
      row[`__alert_${stream}`];

    const rawValue =
      row[`__raw_${stream}`];

    return (
      <div className="sensor-anomaly-tooltip">
        <strong>
          Unusual {streamLabels[stream] || stream} reading
        </strong>

        <div>
          {formatTimestamp(alert?.timestamp || label)}
        </div>

        <div>
          Recorded value:{' '}
          <strong>{rawValue}</strong>
        </div>

        <div className="sensor-anomaly-warning">
          Needs attention
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-chart-tooltip">
      <strong>
        {new Date(label).toLocaleString()}
      </strong>

      {payload.map((item) => {
        const stream = item.dataKey;

        const rawValue =
          item.payload?.[`__raw_${stream}`];

        return (
          <div
            key={stream}
            className="sensor-tooltip-row"
          >
            <span className="sensor-tooltip-label">
              <span
                className="sensor-tooltip-color-dot"
                style={{
                  backgroundColor: item.color || "#64748b",
                }}
                aria-hidden="true"
              />

              <span>
                {streamLabels[stream] || stream}
              </span>
            </span>

            <strong>
              {rawValue}
            </strong>
          </div>
        );
      })}
    </div>
  );
};

const Chart = ({
  data,
  selectedStreams,
  streamLabels = {},
  alerts = [],
  highlightedStream = null,
}) => {
  if (selectedStreams.length === 0) {
    return (
      <p className="chart-empty-state">
        Select one or more streams to view the sensor timeline.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="chart-empty-state">
        No readings are available for the selected streams and time range.
      </p>
    );
  }

  const isMultiStream =
    selectedStreams.length >= 2;

  const stats = Object.fromEntries(
    selectedStreams.map((stream) => [
      stream,
      calculateStreamStats(data, stream),
    ])
  );

  /*
   * Create raw/normalised chart data first.
   */
  const chartData = data.map((row) => {
    const updatedRow = {
      ...row,
    };

    selectedStreams.forEach((stream) => {
      const rawValue = Number(row[stream]);

      updatedRow[`__raw_${stream}`] =
        Number.isFinite(rawValue)
          ? rawValue
          : null;

      if (!isMultiStream) {
        updatedRow[stream] =
          Number.isFinite(rawValue)
            ? rawValue
            : null;

        return;
      }

      const {
        mean,
        standardDeviation,
      } = stats[stream];

      if (!Number.isFinite(rawValue)) {
        updatedRow[stream] = null;
      } else if (standardDeviation === 0) {
        updatedRow[stream] = 0;
      } else {
        updatedRow[stream] =
          (rawValue - mean) /
          standardDeviation;
      }
    });

    return updatedRow;
  });

  /*
   * Only POINTWISE_ANOMALY alerts belong
   * on this timeline.
   */
  const anomalyAlerts = alerts.filter(
    (alert) =>
      alert?.alert_type ===
      'POINTWISE_ANOMALY'
  );

  /*
   * Determine the currently visible time range
   * once before processing anomaly alerts.
   */
  const visibleTimes = chartData
    .map((row) =>
      new Date(row.created_at).getTime()
    )
    .filter(Number.isFinite);

  const visibleStart =
    visibleTimes.length > 0
      ? Math.min(...visibleTimes)
      : null;

  const visibleEnd =
    visibleTimes.length > 0
      ? Math.max(...visibleTimes)
      : null;

  /*
   * Map anomalies within the visible time
   * range to the closest chart timestamp.
   *
   * Alerts outside the visible range are
   * ignored so they are not incorrectly
   * attached to the first or last point.
   */
  anomalyAlerts.forEach((alert) => {
    const stream = findMatchingStream(
      alert,
      selectedStreams,
      streamLabels
    );

    if (!stream || !alert?.timestamp) {
      return;
    }

    const alertTime = new Date(
      alert.timestamp
    ).getTime();

    if (!Number.isFinite(alertTime)) {
      return;
    }

    /*
     * Do not attach an out-of-range anomaly
     * to the nearest visible chart point.
     */
    console.log('Anomaly range check:', {
      anomalyTime: alert.timestamp,
      visibleStart: new Date(visibleStart).toISOString(),
      visibleEnd: new Date(visibleEnd).toISOString(),
      inRange:
        alertTime >= visibleStart &&
        alertTime <= visibleEnd,
    });
    if (
      visibleStart === null ||
      visibleEnd === null ||
      alertTime < visibleStart ||
      alertTime > visibleEnd
    ) {
      return;
    }

    let closestIndex = -1;
    let smallestDifference = Infinity;

    chartData.forEach((row, index) => {
      const rowTime = new Date(
        row.created_at
      ).getTime();

      if (!Number.isFinite(rowTime)) {
        return;
      }

      const difference = Math.abs(
        rowTime - alertTime
      );

      if (
        difference <
        smallestDifference
      ) {
        smallestDifference =
          difference;

        closestIndex = index;
      }
    });

    if (closestIndex === -1) {
      return;
    }

    const closestRow =
      chartData[closestIndex];

    closestRow[
      `__anomaly_${stream}`
    ] = true;

    closestRow[
      `__alert_${stream}`
    ] = alert;

    const alertRawValue =
      getRawAlertValue(
        alert,
        stream,
        streamLabels
      );

    if (alertRawValue !== null) {
      closestRow[
        `__raw_${stream}`
      ] = alertRawValue;
    }
  });

  const renderAnomalyDot =
    (stream) => (props) => {
      const {
        cx,
        cy,
        payload,
      } = props;

      if (
        !payload?.[
          `__anomaly_${stream}`
        ]
      ) {
        return null;
      }

      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth={2}
        />
      );
    };

  return (
    <div
      className="sensor-timeline-chart"
      role="img"
      aria-label="Sensor timeline"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 10,
          }}
        >
          <CartesianGrid
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            vertical={true}
          />

          <XAxis
            dataKey="created_at"
            minTickGap={30}
            tickFormatter={
              formatTimestamp
            }
            tick={{
              fill: '#64748b',
              fontSize: 12,
            }}
            label={{
              value: 'Time',
              position: 'insideBottom',
              offset: -10,
              fill: '#334155',
              fontSize: 12,
              fontWeight: 700,
            }}
          />

          <YAxis
            tick={{
              fill: '#64748b',
              fontSize: 12,
            }}
            label={{
              value: isMultiStream
                ? 'Normalised value'
                : 'Value',
              angle: -90,
              position: 'insideLeft',
              fill: '#334155',
              fontSize: 12,
              fontWeight: 700,
            }}
          />

          <Tooltip
            content={
              <TimelineTooltip
                streamLabels={
                  streamLabels
                }
              />
            }
          />

          <Legend
            wrapperStyle={{
              paddingTop: 12,
              fontSize: 12,
            }}
          />

          {selectedStreams.map(
            (stream, index) => (
              <Line
                key={stream}
                type="monotone"
                dataKey={stream}
                name={streamLabels[stream] || stream}
                stroke={getChartColor(index)}
                strokeWidth={
                  highlightedStream === stream ? 4 : 2.5
                }
                strokeOpacity={
                  highlightedStream && highlightedStream !== stream
                    ? 0.2
                    : 1
                }
                dot={renderAnomalyDot(stream)}
                activeDot={{ r: 4 }}
                connectNulls
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;