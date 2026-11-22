import "./AnalysisSummary.css";

const normaliseName = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const formatFallbackName = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getDisplayName = (metric, streamLabels = {}) => {
  if (!metric) return "Unknown sensor";

  if (streamLabels[metric]) {
    return streamLabels[metric];
  }

  const normalisedMetric = normaliseName(metric);

  const matchingLabel = Object.values(streamLabels).find(
    (label) => normaliseName(label) === normalisedMetric
  );

  return matchingLabel || formatFallbackName(metric);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getMetrics = (alert) => {
  if (Array.isArray(alert?.target?.metrics)) {
    return alert.target.metrics;
  }

  if (Array.isArray(alert?.target)) {
    return alert.target;
  }

  if (typeof alert?.target === "string") {
    return [alert.target];
  }

  return [];
};

const getRecordedValue = (alert) => {
  const candidates = [
    alert?.sensor_value,
    alert?.target?.sensor_value,
    alert?.supporting_values?.sensor_value,
    alert?.supporting_values?.value,
    alert?.supporting_values?.raw_value,
    alert?.supporting_values?.recorded_value,
  ];

  return candidates.find(
    (value) => value !== undefined && value !== null
  );
};

const groupAlerts = (alerts = []) => {
  const anomalyGroups = new Map();
  const relationshipGroups = new Map();

  alerts.forEach((alert) => {
    if (alert?.alert_type === "POINTWISE_ANOMALY") {
      const metric = getMetrics(alert)[0] || "unknown";
      const key = normaliseName(metric);

      if (!anomalyGroups.has(key)) {
        anomalyGroups.set(key, {
          metric,
          alerts: [],
        });
      }

      anomalyGroups.get(key).alerts.push(alert);
    }

    if (alert?.alert_type === "CORRELATION_CHANGE") {
      const metrics = getMetrics(alert);

      if (metrics.length < 2) {
        return;
      }

      const sortedMetrics = [...metrics].sort((a, b) =>
        normaliseName(a).localeCompare(normaliseName(b))
      );

      const key = sortedMetrics.map(normaliseName).join("|");

      if (!relationshipGroups.has(key)) {
        relationshipGroups.set(key, {
          metrics: sortedMetrics,
          alerts: [],
        });
      }

      relationshipGroups.get(key).alerts.push(alert);
    }
  });

  return {
    anomalyGroups: [...anomalyGroups.values()],
    relationshipGroups: [...relationshipGroups.values()],
  };
};

const AnalysisSummary = ({
  alerts = [],
  loading = false,
  error = null,
  hasAnalysed = false,
  streamLabels = {},
  summary = null,
}) => {
  if (!hasAnalysed && !loading) {
    return (
      <section className="analysis-summary-panel">
        <h3 className="analysis-summary-title">Analysis Summary</h3>

        <div className="analysis-summary-state">
          Run an analysis to view the summary.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="analysis-summary-panel"
        aria-live="polite"
      >
        <h3 className="analysis-summary-title">Analysis Summary</h3>

        <div className="analysis-summary-state">
          Running analysis...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="analysis-summary-panel analysis-summary-panel--error"
        role="alert"
      >
        <h3 className="analysis-summary-title">Analysis Summary</h3>

        <div className="analysis-summary-overall">
          <strong>Analysis could not be completed</strong>

          <p>
            The analysis did not finish successfully. Please try again.
          </p>
        </div>

        {error.message && (
          <details className="analysis-summary-details">
            <summary>Technical details</summary>
            <p>{error.message}</p>
          </details>
        )}
      </section>
    );
  }

  if (alerts.length === 0) {
    return (
      <section
        className="analysis-summary-panel analysis-summary-panel--clear"
        aria-live="polite"
      >
        <h3 className="analysis-summary-title">Analysis Summary</h3>

        <div className="analysis-summary-overall">
          <strong>No issues detected</strong>

          <p>
            No unusual sensor behaviour or relationship changes were found.
          </p>
        </div>

        <div className="analysis-summary-metrics">
          <div className="analysis-summary-metric">
            <strong>{summary?.processed_items ?? "N/A"}</strong>
            <span>Readings analysed</span>
          </div>

          <div className="analysis-summary-metric">
            <strong>0</strong>
            <span>Total issues</span>
          </div>

          <div className="analysis-summary-metric">
            <strong>0</strong>
            <span>Sensors affected</span>
          </div>
        </div>

        {summary && (
          <details className="analysis-summary-details analysis-summary-run-details">
            <summary>Analysis details</summary>

            {summary.processed_items !== undefined && (
              <p>Processed items: {summary.processed_items}</p>
            )}

            {summary.alert_count !== undefined && (
              <p>Alerts detected: {summary.alert_count}</p>
            )}
          </details>
        )}
      </section>
    );
  }

  const { anomalyGroups, relationshipGroups } = groupAlerts(alerts);

  const groupedIssueCount =
    anomalyGroups.length + relationshipGroups.length;

  const affectedSensors = new Set();

  anomalyGroups.forEach(({ metric }) => {
    affectedSensors.add(normaliseName(metric));
  });

  relationshipGroups.forEach(({ metrics }) => {
    metrics.forEach((metric) => {
      affectedSensors.add(normaliseName(metric));
    });
  });

  const affectedSensorCount = affectedSensors.size;

  return (
    <section
      className="analysis-summary-panel analysis-summary-panel--issues"
      aria-live="polite"
    >
      <div className="analysis-summary-heading">
        <div>
          <h3 className="analysis-summary-title">Analysis Summary</h3>

          <strong className="analysis-summary-status">
            Issues detected
          </strong>
        </div>

        <span className="analysis-summary-count">
          {groupedIssueCount}{" "}
          {groupedIssueCount === 1 ? "issue" : "issues"}
        </span>
      </div>

      <p className="analysis-summary-intro">
        The analysis found readings or sensor relationships that may need
        attention.
      </p>

      <div className="analysis-summary-metrics">
        <div className="analysis-summary-metric">
          <strong>{summary?.processed_items ?? "N/A"}</strong>
          <span>Readings analysed</span>
        </div>

        <div className="analysis-summary-metric">
          <strong>{groupedIssueCount}</strong>
          <span>Total issues</span>
        </div>

        <div className="analysis-summary-metric">
          <strong>{affectedSensorCount}</strong>
          <span>Sensors affected</span>
        </div>
      </div>

      <div className="analysis-summary-cards">
        {anomalyGroups.map(({ metric, alerts: group }) => {
          const sortedAlerts = [...group].sort(
            (a, b) =>
              new Date(a.timestamp || 0).getTime() -
              new Date(b.timestamp || 0).getTime()
          );

          const firstAlert = sortedAlerts[0];
          const latestAlert =
            sortedAlerts[sortedAlerts.length - 1];

          const firstTime = formatTimestamp(firstAlert?.timestamp);
          const latestTime = formatTimestamp(latestAlert?.timestamp);

          const recordedValue = getRecordedValue(latestAlert);

          return (
            <article
              className="analysis-summary-card"
              key={`anomaly-${normaliseName(metric)}`}
            >
              <span className="analysis-summary-card-type">
                Unusual reading
              </span>

              <h4>{getDisplayName(metric, streamLabels)}</h4>

              <p>
                {group.length === 1
                  ? "An unusual reading was detected for this sensor."
                  : `${group.length} unusual readings were detected${
                      firstTime && latestTime
                        ? ` between ${firstTime} and ${latestTime}`
                        : ""
                    }.`}
              </p>

              {group.length === 1 && latestTime && (
                <div className="analysis-summary-card-row">
                  <span>Detected</span>
                  <strong>{latestTime}</strong>
                </div>
              )}

              {group.length > 1 && firstTime && (
                <div className="analysis-summary-card-row">
                  <span>First detected</span>
                  <strong>{firstTime}</strong>
                </div>
              )}

              {group.length > 1 && latestTime && (
                <div className="analysis-summary-card-row">
                  <span>Last detected</span>
                  <strong>{latestTime}</strong>
                </div>
              )}

              {recordedValue !== undefined && (
                <div className="analysis-summary-card-row">
                  <span>Latest recorded value</span>
                  <strong>{String(recordedValue)}</strong>
                </div>
              )}

              <details className="analysis-summary-details">
                <summary>Technical details</summary>

                <p>
                  Detection method:{" "}
                  {latestAlert?.method || "Not provided"}
                </p>

                <p>
                  Raw alerts in this group: {group.length}
                </p>
              </details>
            </article>
          );
        })}

        {relationshipGroups.map(({ metrics, alerts: group }) => {
          const sortedRelationshipAlerts = [...group].sort(
            (a, b) => {
              const aTime =
                a?.time_window?.start ||
                a?.timestamp ||
                0;

              const bTime =
                b?.time_window?.start ||
                b?.timestamp ||
                0;

              return (
                new Date(aTime).getTime() -
                new Date(bTime).getTime()
              );
            }
          );

          const firstAlert = sortedRelationshipAlerts[0];

          const lastAlert =
            sortedRelationshipAlerts[
              sortedRelationshipAlerts.length - 1
            ];

          const startTime = formatTimestamp(
            firstAlert?.time_window?.start ||
              firstAlert?.timestamp
          );

          const endTime = formatTimestamp(
            lastAlert?.time_window?.end ||
              lastAlert?.timestamp
          );

          const firstName = getDisplayName(
            metrics[0],
            streamLabels
          );

          const secondName = getDisplayName(
            metrics[1],
            streamLabels
          );

          return (
            <article
              className="analysis-summary-card"
              key={`relationship-${metrics
                .map(normaliseName)
                .join("-")}`}
            >
              <span className="analysis-summary-card-type">
                Relationship changed
              </span>

              <h4>
                {firstName} + {secondName}
              </h4>

              <p>
                {group.length === 1
                  ? "A change was detected in how these sensors behaved together."
                  : `${group.length} relationship changes were detected for this sensor pair.`}
              </p>

              {startTime && (
                <div className="analysis-summary-card-row">
                  <span>First change</span>
                  <strong>{startTime}</strong>
                </div>
              )}

              {endTime && (
                <div className="analysis-summary-card-row">
                  <span>Last change</span>
                  <strong>{endTime}</strong>
                </div>
              )}

              <details className="analysis-summary-details">
                <summary>Technical details</summary>

                <p>
                  Detection method:{" "}
                  {lastAlert?.method || "Not provided"}
                </p>

                <p>
                  Raw alerts in this group: {group.length}
                </p>
              </details>
            </article>
          );
        })}
      </div>

      {summary && (
        <details className="analysis-summary-details analysis-summary-run-details">
          <summary>Analysis details</summary>

          {summary.processed_items !== undefined && (
            <p>Processed items: {summary.processed_items}</p>
          )}

          {summary.alert_count !== undefined && (
            <p>Raw alerts detected: {summary.alert_count}</p>
          )}
        </details>
      )}
    </section>
  );
};

export default AnalysisSummary;