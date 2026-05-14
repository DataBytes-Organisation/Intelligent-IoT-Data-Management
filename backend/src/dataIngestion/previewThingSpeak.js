/**
 * previewThingSpeak.js
 * ---------------------
 * Fetches ThingSpeak data and prints a preview in WIDE FORMAT.
 * Does NOT insert anything into the database.
 */

const { fetchThingSpeakFeeds } = require('../services/thingSpeakService');

async function previewThingSpeak(channelId, results = 20) {
  if (!channelId) {
    console.error('Usage: node previewThingSpeak.js <channelId> [results]');
    process.exit(1);
  }

  console.log(`Fetching ThingSpeak channel ${channelId}...`);

  const payload = await fetchThingSpeakFeeds(channelId, { results });

  const feeds = payload?.feeds || [];
  console.log(`Fetched ${feeds.length} feeds.`);

  if (feeds.length === 0) {
    console.warn('No feeds returned.');
    return;
  }

  // Detect fields dynamically
  const sample = feeds[0];
  const fieldKeys = Object.keys(sample).filter(k => k.startsWith('field'));

  console.log('\nDetected fields:', fieldKeys);

  // Build wide-format preview
  const previewRows = feeds.slice(0, 5).map(feed => ({
    created_at: feed.created_at,
    entry_id: feed.entry_id,
    ...Object.fromEntries(
      fieldKeys.map(k => [k, feed[k] ? Number(feed[k]) : null])
    )
  }));

  console.log('\nPreview (first 5 rows):');
  console.table(previewRows);
}

const channelId = process.argv[2];
const results = Number(process.argv[3]) || 20;

previewThingSpeak(channelId, results).catch(err => {
  console.error('Preview failed:', err.message);
});
