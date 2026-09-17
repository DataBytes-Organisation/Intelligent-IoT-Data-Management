// src/dataIngestion/thingSpeakInjest.js
const fetch = require("node-fetch");
const pool = require("../db/pool");
const TimeseriesRepository = require("../repositories/timeseriesRepository.js");

const repo = new TimeseriesRepository();

async function ingestThingSpeak(datasetName, apiUrl, ownerUserId) {
  console.log("--------------------------------------------------");
  console.log("ThingSpeak Ingestion Started");
  console.log(`Dataset: ${datasetName}`);
  console.log(`URL: ${apiUrl}`);
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log("--------------------------------------------------");

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.feeds || !Array.isArray(data.feeds)) {
      throw new Error("Invalid ThingSpeak response: missing feeds array");
    }

    if (data.feeds.length === 0) {
      console.warn("ThingSpeak returned no data.");
      return;
    }

    // 1. Create or retrieve dataset
    const datasetResult = await pool.query(
      `INSERT INTO datasets (name, created_by, updated_by)
      VALUES ($1, $2, $2)
      ON CONFLICT (created_by, name) WHERE deleted_at IS NULL
      DO UPDATE SET updated_by = EXCLUDED.updated_by,
                    updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [datasetName, ownerUserId]
    );

    const datasetId = datasetResult.rows[0].id;

    // 2. Detect all fieldX keys dynamically
    const sampleFeed = data.feeds[0];
    const metricKeys = Object.keys(sampleFeed).filter(k => k.startsWith("field"));

    console.log("Detected ThingSpeak metrics:", metricKeys);

    // 3. Insert each feed row through repository
    let count = 0;

    for (const feed of data.feeds) {
      const fields = Object.fromEntries(
        metricKeys.map(k => [k, feed[k] ?? null])
      );

      await repo.insertWideRow(
        datasetId,
        feed.created_at,
        feed.entry_id,
        fields
      );

      console.log(`Inserted entry_id=${feed.entry_id}`);
      count++;
    }

    console.log("--------------------------------------------------");
    console.log("ThingSpeak Ingestion Finished");
    console.log(`Total Rows Inserted: ${count}`);
    console.log(`End Time: ${new Date().toISOString()}`);
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("ThingSpeak Ingestion Error:", error.message);
  }
}

const datasetName = process.argv[2];
const apiUrl = process.argv[3];
const ownerUserId = process.argv[4];

if (!datasetName || !apiUrl || !ownerUserId) {
  console.error("Usage: node thingSpeakInjest.js <datasetName> <apiUrl> <ownerUserId>");
  process.exit(1);
}

ingestThingSpeak(datasetName, apiUrl, ownerUserId);
