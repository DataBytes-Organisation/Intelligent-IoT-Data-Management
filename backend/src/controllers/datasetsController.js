/**
 * DATASETS CONTROLLER
 * --------------------
 * Responsible for handling all dataset‑level operations.
 * This includes:
 *   - Listing all datasets
 *   - Fetching a single dataset by ID
 *   - Creating a new dataset
 *
 * This controller does NOT deal with time‑series rows.
 * It only manages dataset metadata (name, description, etc.).
 */

const datasetService = require('../services/datasetService');

/**
 * GET /api/datasets
 * Returns a list of all datasets.
 */
const getAllDatasets = async (req, res) => {
  try {
    const datasets = await datasetService.getAllDatasets();
    return res.status(200).json(datasets);
  } catch (err) {
    console.error('Error getting datasets:', err);
    return res.status(500).json({ error: 'Failed to load datasets' });
  }
};

/**
 * GET /api/datasets/:id
 * Returns a single dataset by its ID.
 */
const getDatasetById = async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = await datasetService.getDatasetById(id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    return res.status(200).json(dataset);
  } catch (err) {
    console.error('Error getting dataset by ID:', err);
    return res.status(500).json({ error: 'Failed to load dataset' });
  }
};

/**
 * POST /api/datasets
 * Creates a new dataset.
 * Disabled — datasets are created automatically by ingestion.
 */
const createDataset = async (req, res) => {
  try {
    const dataset = await datasetService.createDataset(req.body);
    return res.status(201).json(dataset);
  } catch (err) {
    console.error('Error creating dataset:', err);
    return res.status(500).json({ error: 'Failed to create dataset' });
  }
};

module.exports = {
  getAllDatasets,
  getDatasetById,
  createDataset,
};
