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
 * GET /api/datasets/:datasetId/timestamps
 * Returns a list of timestamps for the dataset.
 */
const getTimestampsForDatasetId = async (req, res) => {
  try {
    const { datasetId } = req.params;
    if (!/^\d+$/.test(datasetId) || Number(datasetId) < 1) {
      return res.status(400).json({ error: 'Dataset ID must be a positive integer' });
    }

    const entries = await timeseriesService.getWideEntriesForDatasetId(
      Number(datasetId),
      req.user.sub
    );

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
  getTimestampsForDatasetId,
};
