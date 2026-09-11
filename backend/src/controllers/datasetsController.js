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
 * It manages dataset metadata and the reviewed CSV import endpoint.
 */

const datasetService = require('../services/datasetService');
const crypto = require('crypto');

const requestId = (req) => req.get('x-request-id') || `req_${crypto.randomUUID()}`;
const datasetError = (res, req, err) => {
  const status = err.status || (err.code === '23505' ? 409 : 500);
  const code = err.code === '23505' ? 'DATASET_NAME_EXISTS' : err.code || 'INTERNAL_ERROR';
  if (status >= 500) console.error('Dataset request failed:', err);
  const error = {
    code,
    message: status === 500 ? 'An unexpected error occurred.' : err.message,
  };
  if (err.fields) error.fields = err.fields;
  return res.status(status).json({ error, meta: { requestId: requestId(req) } });
};

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
    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({ error: 'Dataset ID must be a positive integer' });
    }
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
 * Imports the reviewed CSV rows and their saved field mappings.
 */
const createDataset = async (req, res) => {
  try {
    const dataset = await datasetService.importDataset(req.body, req.user.sub);
    return res.status(201).json({ data: dataset, meta: { requestId: requestId(req) } });
  } catch (err) {
    return datasetError(res, req, err);
  }
};

/**
 * PUT /api/datasets/:id
 * Replaces dataset mapping metadata and/or appends canonical wide rows.
 */
const updateDataset = async (req, res) => {
  try {
    const dataset = await datasetService.updateDataset(req.params.id, req.body, req.user);
    return res.status(200).json({ data: dataset, meta: { requestId: requestId(req) } });
  } catch (err) {
    return datasetError(res, req, err);
  }
};

module.exports = {
  getAllDatasets,
  getDatasetById,
  createDataset,
  updateDataset,
};
