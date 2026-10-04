#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const baseUrl = (args.baseUrl || 'http://127.0.0.1:3000').replace(/\/$/, '');
const iterations = Number(args.iterations || 30);
const label = args.label || 'local';
const outputDir = args.outputDir || 'benchmark_results/pr177-api';

const endpoints = [
  { name: 'backend_health', method: 'GET', path: '/health', expected: [200] },
  { name: 'backend_ready', method: 'GET', path: '/ready', expected: [200, 503] },
  { name: 'backend_metrics', method: 'GET', path: '/metrics', expected: [200] },
  { name: 'dataset_list', method: 'GET', path: '/api/datasets', expected: [200, 401, 403, 500] },
];

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function timeRequest(endpoint) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: { accept: '*/*' },
    });
    await response.arrayBuffer();
    return {
      ok: endpoint.expected.includes(response.status),
      status: response.status,
      durationMs: performance.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'NETWORK_ERROR',
      durationMs: performance.now() - started,
      error: error.message,
    };
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const rows = [];

  for (const endpoint of endpoints) {
    for (let i = 0; i < iterations; i += 1) {
      const result = await timeRequest(endpoint);
      rows.push({
        label,
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        iteration: i + 1,
        status: result.status,
        ok: result.ok,
        durationMs: Number(result.durationMs.toFixed(2)),
        error: result.error || '',
      });
    }
  }

  const summary = endpoints.map((endpoint) => {
    const endpointRows = rows.filter((row) => row.endpoint === endpoint.name);
    const durations = endpointRows.map((row) => row.durationMs);
    const failures = endpointRows.filter((row) => !row.ok).length;

    return {
      label,
      endpoint: endpoint.name,
      path: endpoint.path,
      requests: endpointRows.length,
      failures,
      errorRatePercent: Number(((failures / endpointRows.length) * 100).toFixed(2)),
      minMs: Number(Math.min(...durations).toFixed(2)),
      avgMs: Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2)),
      p50Ms: Number(percentile(durations, 50).toFixed(2)),
      p95Ms: Number(percentile(durations, 95).toFixed(2)),
      maxMs: Number(Math.max(...durations).toFixed(2)),
    };
  });

  await mkdir(outputDir, { recursive: true });

  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  const payload = {
    label,
    baseUrl,
    iterations,
    startedAt,
    completedAt: new Date().toISOString(),
    summary,
    rows,
  };

  await writeFile(
    `${outputDir}/${safeLabel}.json`,
    `${JSON.stringify(payload, null, 2)}\n`,
  );

  const csvHeader = 'label,endpoint,path,requests,failures,errorRatePercent,minMs,avgMs,p50Ms,p95Ms,maxMs';
  const csvRows = summary.map((row) => [
    row.label,
    row.endpoint,
    row.path,
    row.requests,
    row.failures,
    row.errorRatePercent,
    row.minMs,
    row.avgMs,
    row.p50Ms,
    row.p95Ms,
    row.maxMs,
  ].join(','));

  await writeFile(`${outputDir}/${safeLabel}.csv`, `${csvHeader}\n${csvRows.join('\n')}\n`);

  console.table(summary);
  console.log(`Wrote ${outputDir}/${safeLabel}.json and ${outputDir}/${safeLabel}.csv`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
