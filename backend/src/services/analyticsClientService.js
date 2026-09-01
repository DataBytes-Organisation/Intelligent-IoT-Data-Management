/**
 * ANALYTICS CLIENT SERVICE
 * -------------------------
 * Handles HTTP communication with external
 * Correlation and Anomaly services.
 */

const DEFAULT_TIMEOUT_MS =
  Number(process.env.ANALYTICS_TIMEOUT_MS) || 5000;

const DEFAULT_MAX_RETRIES =
  Number(process.env.ANALYTICS_MAX_RETRIES) || 2;

/**
 * Delay helper used between retry attempts.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a POST request to an Analytics service.
 */
async function postAnalyticsRequest(
  url,
  payload,
  options = {}
) {
  if (!url) {
    throw new Error('Analytics service URL is not configured');
  }

  const timeoutMs =
    options.timeoutMs || DEFAULT_TIMEOUT_MS;

  const maxRetries =
    options.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();

    const timeout =
      setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `Analytics service returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      return data;

    } catch (error) {
      clearTimeout(timeout);

      lastError = error;

      if (error.name === 'AbortError') {
        lastError = new Error(
          `Analytics service request timed out after ${timeoutMs}ms`
        );
      }

      if (attempt < maxRetries) {
        await delay(500);
      }
    }
  }

  throw lastError;
}

/**
 * Call the Correlation service.
 */
async function callCorrelation(payload) {
  const baseUrl = process.env.CORRELATION_SERVICE_URL;

  if (!baseUrl) {
    throw new Error('Correlation service URL is not configured');
  }

  return postAnalyticsRequest(
    `${baseUrl}/detect-correlation-alert`,
    payload
  );
}

/**
 * Call the Anomaly service.
 */
async function callAnomaly(payload) {
  return postAnalyticsRequest(
    process.env.ANOMALY_SERVICE_URL,
    payload
  );
}

module.exports = {
  postAnalyticsRequest,
  callCorrelation,
  callAnomaly,
};