//Block 1 - Imports and Basic Validation
import { useEffect, useState } from 'react';
import defaultMockResponse from "../mocks/dashboard/alertResponse.json";


const isNonEmptyString = (value) =>
    typeof value === 'string' && value.trim().length > 0;

const isValidDateString = (value) => {
    return (
        isNonEmptyString(value) &&
        !Number.isNaN(Date.parse(value))
    );
};

//Block 2 - Alert Target Validation
const isValidTarget = (target) => {
    return (
        isNonEmptyString(target) ||
        (Array.isArray(target) &&
            target.length > 0 &&
            target.every(isNonEmptyString))
    );
};

//Block 3 - Time Window Validation (optional)
const isValidTimeWindow = (timeWindow) => {
    if (timeWindow === undefined) {
        return true;
    }

    if (
        timeWindow === null ||
        typeof timeWindow !== "object" ||
        Array.isArray(timeWindow)
    ) {
        return false;
    }

    return (
        isValidDateString(timeWindow.start) &&
        isValidDateString(timeWindow.end) &&
        Date.parse(timeWindow.start) <= Date.parse(timeWindow.end)
    );
};

//Block 4 - Supporting Values Validation (optional)
const isValidSupportingValues = (supportingValues) => {
    if (supportingValues === undefined) {
        return true;
    }

    if (
        supportingValues === null ||
        typeof supportingValues !== "object" ||
        Array.isArray(supportingValues)
    ) {
        return false;
    }

    const keys = Object.keys(supportingValues);

    return (
        keys.length > 0 &&
        keys.every((key) => {
            return (
                isNonEmptyString(key) &&
                typeof supportingValues[key] === "number" &&
                Number.isFinite(supportingValues[key])
            );
        })
    );
};

//Block 5 - Main Alert Validation Function
const isValidAlert = (alert) => {
    // To check if alert is an object and not null or an array
    if (
        alert === null ||
        typeof alert !== "object" ||
        Array.isArray(alert)
    ) {
        return false;
    }

    return (
        isNonEmptyString(alert.alert_id) &&
        isValidDateString(alert.timestamp) &&
        isNonEmptyString(alert.alert_type) &&
        isValidTarget(alert.target) &&
        isNonEmptyString(alert.method) &&
        isNonEmptyString(alert.message) &&
        isNonEmptyString(alert.source) &&
        typeof alert.score === "number" &&
        Number.isFinite(alert.score) &&
        isNonEmptyString(alert.severity) &&
        isValidTimeWindow(alert.time_window) &&
        isValidSupportingValues(alert.supporting_values)
    );
};

//Block 6 - Alert Response Validation - Complete backend response
const validateAlertResponse = (payload) => {
    if (
        payload === null ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error("Alert response must be an object");
    }

    if (payload.status !== "success") {
        throw new Error("Alert response was not successful");
    }

    if (!isValidDateString(payload.generated_at)) {
        throw new Error("Alert response has an invalid generation time");
    }

    if (!Array.isArray(payload.alerts)) {
        throw new Error("Alert response must contain an alerts array");
    }

    if (
        payload.summary === null ||
        typeof payload.summary !== "object" ||
        Array.isArray(payload.summary)
    ) {
        throw new Error("Alert response must contain a valid summary");
    }

    if (
        !Number.isInteger(payload.summary.processed_items) ||
        payload.summary.processed_items < 0
    ) {
        throw new Error(
            "Processed item count must be a non-negative integer"
        );
    }

    if (
        !Number.isInteger(payload.summary.alert_count) ||
        payload.summary.alert_count < 0
    ) {
        throw new Error(
            "Alert count must be a non-negative integer"
        );
    }

    if (!Array.isArray(payload.errors)) {
        throw new Error("Alert response must contain an errors array");
    }

    if (payload.errors.length > 0) {
        throw new Error(
            "Successful alert response contains backend errors"
        );
    }

    if (payload.summary.alert_count !== payload.alerts.length) {
        throw new Error(
            "Alert count does not match the alerts array"
        );
    }

    const invalidAlertIndex = payload.alerts.findIndex((alert) => {
        return !isValidAlert(alert);
    });

    if (invalidAlertIndex !== -1) {
        throw new Error(
            `Invalid alert record at index ${invalidAlertIndex}`
        );
    }

    const alertIds = payload.alerts.map((alert) => {
        return alert.alert_id;
    });

    const uniqueAlertIds = new Set(alertIds);

    if (uniqueAlertIds.size !== alertIds.length) {
        throw new Error(
            "Alert response contains duplicate alert IDs"
        );
    }

    return payload.alerts;
};

//Block 7 - Custom Hook for Fetching Alerts
export const useAlerts = (
    useMock = true,
    endpoint = "/api/alerts"
) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Block 8 - Effect Hook for Fetching Alerts (Loading Alerts)
    useEffect(() => {
        const controller = new AbortController();

        const loadAlerts = async () => {
            setLoading(true);
            setError(null);
            try {
                let payload;

                if (useMock) {
                    payload = defaultMockResponse;
                } else {
                    const response = await fetch(endpoint, {
                        signal: controller.signal,
                    });

                    if (!response.ok) {
                        throw new Error(
                            `Unable to load alerts: HTTP ${response.status}`
                        );
                    }

                    payload = await response.json();
                }

                const validatedAlerts = validateAlertResponse(payload);
                setAlerts(validatedAlerts);
            } catch (caughtError) {
                if (caughtError.name !== "AbortError") {
                    setAlerts([]);
                    setError(caughtError);
                }
            } finally {
                setLoading(false);
            }
        };

        loadAlerts();

        return () => {
            controller.abort();
        };
    }, [useMock, endpoint]);

    // Block 9 - Return Alert State
    return {
        alerts,
        loading,
        error,
    };
};
