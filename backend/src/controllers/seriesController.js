/**
 * SERIES CONTROLLER
 * ------------------
 * Responsible for returning time‑series data for a dataset.
 * This controller uses the timeseriesService, which:
 *   - Loads long-format rows from the DB
 *   - Pivots them into wide-format entries
 *   - Filters metrics when requested
 *
 * This is the main controller for real sensor/time-series data.
 */

const timeseriesService = require('../services/timeseriesService');

/**
 * GET /api/datasets/:name/series
 * Returns all wide-format time‑series entries for a dataset.
 */
const getSeriesByDatasetName = async (req, res) => {
  try {
    const { name } = req.params;

    const entries = await timeseriesService.getWideEntriesForDatasetName(name);

    if (!entries) {
      return res.status(404).json({ error: 'Dataset not found or empty' });
    }

    return res.status(200).json(entries);
  } catch (err) {
    console.error('Error getting series:', err);
    return res.status(500).json({ error: 'Failed to load series' });
  }
};

/**
 * POST /api/datasets/:datasetId/series/filter
 * Filters wide-format entries by a list of metric names.
 */
const filterSeriesByMetrics = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { streamNames } = req.body;

    if (!/^\d+$/.test(datasetId) || Number(datasetId) < 1) {
      return res.status(400).json({ error: 'Dataset ID must be a positive integer' });
    }

    if (!Array.isArray(streamNames) || streamNames.length === 0) {
      return res.status(400).json({ error: 'streamNames must be a non-empty array' });
    }

    const filtered = await timeseriesService.filterWideEntriesByMetrics(
      Number(datasetId),
      streamNames,
      req.user.sub
    );

    if (!filtered) {
      return res.status(404).json({ error: 'Dataset not found or empty' });
    }

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('Error filtering series:', err);
    return res.status(500).json({ error: 'Failed to filter series' });
  }
};

module.exports = {
  getSeriesByDatasetName,
  filterSeriesByMetrics,
};
