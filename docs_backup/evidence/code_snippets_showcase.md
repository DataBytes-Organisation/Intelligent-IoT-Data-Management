# Code Snippets Showcase (Technical Contribution Evidence)

This file presents concise, high-signal snippets used as evidence for non-disruptive technical contribution.

## 1) Health Endpoint (Reliability Baseline)

Source: `newBackend/BackendCode/app.js`

```js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime()
  });
});
```

Why it matters:
- Adds observability without changing existing business endpoints.

## 2) Backend Smoke Test (Objective Verification)

Source: `newBackend/tests/api.smoke.test.js`

```js
test('GET /health returns service health payload', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.timestamp, 'string');
  assert.equal(typeof body.uptimeSeconds, 'number');
});
```

Why it matters:
- Converts architectural claim into pass/fail evidence.

## 3) Path Resolution Hardening (Stability Fix)

Source: `newBackend/BackendCode/repositories/mockRepository.js`

```js
const configuredPath = process.env.PROCESSED_DATA_PATH;
if (!configuredPath) {
  throw new Error('PROCESSED_DATA_PATH is not configured');
}

this.filePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(__dirname, '..', configuredPath);
```

Why it matters:
- Prevents environment-dependent startup failures in WSL/dev contexts.

## 4) Pearson Correlation Utility (Data Science Path)

Source: `new-frontend/frontend/src/utils/correlationUtils.js`

```js
const numerator = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0);
const denominator = Math.sqrt(
  x.reduce((sum, xi) => sum + (xi - avgX) ** 2, 0) *
  y.reduce((sum, yi) => sum + (yi - avgY) ** 2, 0)
);

return numerator / denominator;
```

Why it matters:
- Demonstrates mathematically grounded correlation implementation used by dashboard insights.

## 5) Variance Guard (Insight Quality Control)

Source: `new-frontend/frontend/src/utils/varianceUtils.js`

```js
export const hasVariance = (data, key) => {
  const values = data.map(d => parseFloat(d[key])).filter(v => !isNaN(v));
  const unique = new Set(values);
  return unique.size > 1;
};
```

Why it matters:
- Prevents misleading visuals when a stream is constant.

## 6) Correlation-Based Outlier Detection (Python Algorithm)

Source: `data_science/algorithms/correlation_based.py`

```python
corr_matrix = df_period.corr()

avg_corr = {}
for stream in streams:
    other_corr = corr_matrix.loc[stream, streams].drop(stream)
    avg_corr[stream] = other_corr.mean()

if threshold is None:
    threshold = avg_corr_series.mean() - avg_corr_series.std()
```

Why it matters:
- Shows reusable analytical logic for anomaly-oriented interpretation.
