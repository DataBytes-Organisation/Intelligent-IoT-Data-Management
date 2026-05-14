// src/dataIngestion/thingSpeakInjest.js
const fetch = require("node-fetch");
const pool = require("../db/pool");
const TimeseriesRepository = require("../repositories/timeseriesRepository.js");

const repo = new TimeseriesRepository();

async function ingestThingSpeak(datasetName, apiUrl) {
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
      `INSERT INTO datasets (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`,
      [datasetName]
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

if (!datasetName || !apiUrl) {
  console.error("Usage: node thingSpeakInjest.js <datasetName> <apiUrl>");
  process.exit(1);
}

ingestThingSpeak(datasetName, apiUrl);
