const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.MVP_BASE_URL || "http://localhost:3000";
const DATASET = process.env.MVP_DATASET || "thingspeak-live";

const evidenceDir = path.join(__dirname, "..", "docs", "mvp", "evidence");
const resultsPath = path.join(evidenceDir, "e2e-results.csv");

const rows = [];

function add(step, scenario, area, method, check, expected, actual, status, owner, priority) {
  rows.push({ step, scenario, area, method, check, expected, actual, status, owner, priority });
}

async function getJson(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function getStatusSummary() {
  return rows.reduce(
    (counts, row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
      return counts;
    },
    {}
  );
}

function color(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

function green(text) {
  return color(text, 32);
}

function yellow(text) {
  return color(text, 33);
}

function red(text) {
  return color(text, 31);
}

function bold(text) {
  return color(text, 1);
}

function formatStatus(status) {
  if (status === "PASS") return green(status);
  if (status === "BLOCKED") return yellow(status);
  return red(status);
}

function getStatusIcon(status) {
  if (status === "PASS") return green("✓");
  if (status === "BLOCKED") return yellow("!");
  return red("x");
}

async function run() {
  const datasets = await getJson(`${BASE_URL}/api/datasets`);
  const hasDataset =
    Array.isArray(datasets.body) &&
    datasets.body.some((dataset) => dataset.name === DATASET);

  add(
    1,
    "Success",
    "Dataset API",
    "GET",
    "/api/datasets",
    `${DATASET} appears in dataset list`,
    hasDataset ? `${DATASET} found` : `${DATASET} missing`,
    hasDataset ? "PASS" : "FAIL",
    "Backend",
    "High"
  );

  const series = await getJson(`${BASE_URL}/api/datasets/${DATASET}/series`);
  const hasRows = Array.isArray(series.body) && series.body.length > 0;

  add(
    2,
    "Success",
    "Series API",
    "GET",
    `/api/datasets/${DATASET}/series`,
    "Live persisted rows are returned",
    hasRows ? `Returned ${series.body.length} rows` : JSON.stringify(series.body),
    hasRows ? "PASS" : "FAIL",
    "Backend",
    "High"
  );

  const empty = await getJson(`${BASE_URL}/api/datasets/not-a-real-dataset/series`);
  const emptyHandled = Boolean(empty.body && empty.body.error);

  add(
    3,
    "Empty data",
    "Series API",
    "GET",
    "/api/datasets/not-a-real-dataset/series",
    "Clear missing dataset response",
    emptyHandled ? empty.body.error : JSON.stringify(empty.body),
    emptyHandled ? "PASS" : "FAIL",
    "Backend",
    "Medium"
  );

  const invalid = await postJson(
    `${BASE_URL}/api/datasets/${DATASET}/series/filter`,
    {}
  );
  const validationHandled = invalid.status === 400 && invalid.body.error;

  add(
    4,
    "Validation error",
    "Filter API",
    "POST",
    `/api/datasets/${DATASET}/series/filter`,
    "Invalid request is rejected",
    validationHandled ? invalid.body.error : JSON.stringify(invalid.body),
    validationHandled ? "PASS" : "FAIL",
    "Backend",
    "Medium"
  );

  const filtered = await postJson(
    `${BASE_URL}/api/datasets/${DATASET}/series/filter`,
    {
      streamNames: ["field3", "field4", "field6"],
    }
  );
  const filteredOk =
    filtered.status === 200 &&
    Array.isArray(filtered.body) &&
    filtered.body.length > 0;

  add(
    5,
    "Success",
    "Filter API",
    "POST",
    `/api/datasets/${DATASET}/series/filter`,
    "Filtered live rows are returned",
    filteredOk
      ? `Returned ${filtered.body.length} filtered rows`
      : JSON.stringify(filtered.body),
    filteredOk ? "PASS" : "FAIL",
    "Backend",
    "High"
  );

  const analyse = await postJson(`${BASE_URL}/api/analyse`, {
    datasetName: DATASET,
    streamNames: ["field3", "field4", "field6"],
  });
  const placeholder = JSON.stringify(analyse.body).includes("placeholder");

  add(
    6,
    "Incomplete",
    "Analytics API",
    "POST",
    "/api/analyse",
    "Real analytics execution is performed",
    placeholder ? "Returned placeholder message only" : JSON.stringify(analyse.body),
    placeholder ? "BLOCKED" : "PASS",
    "Backend API / Analytics",
    "High"
  );

  const schemaPath = path.join(__dirname, "..", "src", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const hasAlertsTable = /CREATE TABLE\s+alerts/i.test(schema);

  add(
    7,
    "Incomplete",
    "Alert persistence",
    "N/A",
    "Backend schema/routes",
    "Generated alerts are persisted",
    hasAlertsTable ? "Alerts table found" : "No alerts table found",
    hasAlertsTable ? "PASS" : "BLOCKED",
    "Backend API / Analytics",
    "High"
  );

  const dashboardPath = path.join(
    __dirname,
    "..",
    "..",
    "new-frontend",
    "frontend",
    "src",
    "components",
    "Dashboard.jsx"
  );
  const dashboard = fs.readFileSync(dashboardPath, "utf8");
  const usesMock = dashboard.includes("useSensorData(true)");

  add(
    8,
    "Incomplete",
    "Dashboard rendering",
    "N/A",
    "Frontend dashboard",
    "Dashboard renders live backend data",
    usesMock
      ? "Dashboard uses useSensorData(true)"
      : "Dashboard is not hardcoded to mock mode",
    usesMock ? "BLOCKED" : "PASS",
    "Frontend",
    "High"
  );

  fs.mkdirSync(evidenceDir, { recursive: true });

  const header =
    "Step,Scenario,Area,Method,Endpoint Or Check,Expected Result,Actual Result,Status,Owner,Priority";

  const csv = [
    header,
    ...rows.map((row) =>
      [
        row.step,
        row.scenario,
        row.area,
        row.method,
        row.check,
        row.expected,
        row.actual,
        row.status,
        row.owner,
        row.priority,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ].join("\n");

  fs.writeFileSync(resultsPath, csv);

  const summary = getStatusSummary();
  const total = rows.length;

  console.log("");
  console.log(bold("MVP E2E Smoke Test"));
  console.log("");

  rows.forEach((row) => {
    console.log(`${getStatusIcon(row.status)} ${row.area} - ${formatStatus(row.status)}`);
  });

  console.log("");
  console.log(`Checks: ${total}`);
  console.log(`Passed: ${green(summary.PASS || 0)}`);
  console.log(`Failed: ${red(summary.FAIL || 0)}`);
  console.log(`Blocked: ${yellow(summary.BLOCKED || 0)}`);
  console.log("");
  console.log(`Evidence: ${resultsPath}`);
}

run().catch((error) => {
  console.error(red(`MVP smoke test failed: ${error.message}`));
  process.exit(1);
});