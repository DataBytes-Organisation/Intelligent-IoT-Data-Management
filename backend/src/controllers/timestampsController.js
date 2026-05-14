/**
 * TIMESTAMPS CONTROLLER
 * ----------------------
 * Responsible for returning timestamps associated with a dataset.
 * Timestamps are extracted from the same wide-format entries
 * produced by the timeseriesService.
 *
 * This controller is useful for:
 *   - timeline visualisations
 *   - selecting time ranges
 *   - syncing frontend charts
 */

const timeseriesService = require('../services/timeseriesService');

/**
 * GET /api/datasets/:name/timestamps
 * Returns a list of timestamps for the dataset.
 */
const getTimestampsForDatasetName = async (req, res) => {
  try {
    const { name } = req.params;

    const entries = await timeseriesService.getWideEntriesForDatasetName(name);

    if (!entries) {
      return res.status(404).json({ error: 'Dataset not found or empty' });
    }

    const timestamps = entries.map((e) => e.created_at);

    return res.status(200).json(timestamps);
  } catch (err) {
    console.error('Error getting timestamps:', err);
    return res.status(500).json({ error: 'Failed to load timestamps' });
  }
};

module.exports = {
  getTimestampsForDatasetName,
};
