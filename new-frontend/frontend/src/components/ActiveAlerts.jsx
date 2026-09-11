// Block 10 - Active Alerts Imports

import "./ActiveAlerts.css";

// Block 11 - Convert Technical Values into Readable Labels
const formatLabel = (value) => {
    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => {
            return character.toUpperCase();
        });
};

// Block 12 - Format Alert Targets
const formatTarget = (target) => {
    if (Array.isArray(target)) {
        return target.map(formatLabel).join(" ↔ ");
    }

    if (target && Array.isArray(target.metrics)) {
        return target.metrics.map(formatLabel).join(" ↔ ");
    }

    if (typeof target === "string") {
        return formatLabel(target);
    }

    return "Unknown";
};

// Block 13 - Format the Alert Timestamp
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

// Block 14 - Format Detection Method Names
const METHOD_LABELS = {
    isolationforest: "Isolation Forest",
    pearson: "Pearson Correlation",
};

const formatMethod = (method) => {
    const normalizedMethod = method.toLowerCase();

    return METHOD_LABELS[normalizedMethod] ?? formatLabel(method);
};

// Block 15 - Active Alerts Component and Loading State
const ActiveAlerts = ({
    alerts = [],
    loading = false,
    error = null,
    hasAnalysed = false,
}) => {
    if (!hasAnalysed) {
        return (
            <section
                className="active-alerts-panel active-alerts-panel--empty"
                aria-live="polite"
            >
                <h2 className="active-alerts-title">
                    Active Alerts
                </h2>

                <p className="active-alerts-status">
                    Run an analysis to view active alerts.
                </p>
            </section>
        );
    }

    if (loading) {
        return (
            <section
                className="active-alerts-panel"
                aria-live="polite"
            >
                <h2 className="active-alerts-title">
                    Active Alerts
                </h2>

                <p className="active-alerts-status">
                    Loading active alerts...
                </p>
            </section>
        );
    }
    // Block 16 - Error State
    if (error) {
        return (
            <section
                className="active-alerts-panel active-alerts-panel--error"
                role="alert"
            >
                <h2 className="active-alerts-title">
                    Active Alerts
                </h2>

                <p className="active-alerts-status">
                    Unable to display active alerts.
                </p>

                <p className="active-alerts-error-detail">
                    {error.message}
                </p>
            </section>
        );
    }
    // Block 17 - Empty Alerts State
    if (alerts.length === 0) {
        return (
            <section
                className="active-alerts-panel active-alerts-panel--empty"
                aria-live="polite"
            >
                <h2 className="active-alerts-title">
                    Active Alerts
                </h2>

                <p className="active-alerts-status">
                    Currently, there are no active alerts.
                </p>
            </section>
        );
    }
    // Block 18 - Successful Alerts List
    return (
        <section
            className="active-alerts-panel"
            aria-live="polite"
        >
            <div className="active-alerts-heading">
                <h2 className="active-alerts-title">
                    Active Alerts
                </h2>

                <span className="active-alerts-count">
                    {alerts.length} active
                </span>
            </div>

            <div className="active-alerts-list">
                {alerts.map((alert, index) => {
                    return (
                        <article
                            className={`alert-card ${alert.severity ? `alert-card--${alert.severity.toLowerCase()}` : ''}`}
                            key={alert.alert_id ?? `${alert.alert_type}-${alert.timestamp}-${index}`}
                        >
                            <header className="alert-card-header">
                                {alert.severity && (
                                    <span className="alert-severity">
                                        {formatLabel(alert.severity)}
                                    </span>
                                )}

                                <time
                                    className="alert-timestamp"
                                    dateTime={alert.timestamp}
                                >
                                    {formatTimestamp(alert.timestamp)}
                                </time>
                            </header>
                            <p className="alert-type">
                                {formatLabel(alert.alert_type)}
                            </p>

                            <h3 className="alert-target">
                                {formatTarget(alert.target)}
                            </h3>

                            <p className="alert-message">
                                {alert.message}
                            </p>

                            <dl className="alert-metadata">
                                <div className="alert-metadata-item">
                                    <dt>Method</dt>
                                    <dd>{formatMethod(alert.method)}</dd>
                                </div>

                                <div className="alert-metadata-item">
                                    <dt>Source</dt>
                                    <dd>{formatLabel(alert.source?.component || "Unknown")}</dd>
                                </div>

                                <div className="alert-metadata-item">
                                    <dt>Score</dt>
                                    <dd>{alert.score.toFixed(2)}</dd>
                                </div>
                            </dl>
                            {alert.supporting_values && (
                                <div className="alert-supporting-values">
                                    <h4>Supporting Values</h4>

                                    <ul>
                                        {Object.entries(
                                            alert.supporting_values
                                        ).map(([name, value]) => {
                                            return (
                                                <li key={name}>
                                                    <span>{formatLabel(name)}</span>
                                                    <strong>{value}</strong>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            {alert.time_window && (
                                <div className="alert-time-window">
                                    <h4>Detection Window</h4>

                                    <p>
                                        <time dateTime={alert.time_window.start}>
                                            {formatTimestamp(
                                                alert.time_window.start
                                            )}
                                        </time>

                                        <span aria-hidden="true"> — </span>

                                        <time dateTime={alert.time_window.end}>
                                            {formatTimestamp(
                                                alert.time_window.end
                                            )}
                                        </time>
                                    </p>
                                </div>
                            )}
                            <p className="alert-id">
                                Alert ID: <code>{alert.alert_id}</code>
                            </p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default ActiveAlerts;
