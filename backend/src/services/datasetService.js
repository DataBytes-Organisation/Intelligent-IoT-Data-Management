/**
 * DATASET SERVICE
 * ----------------
 * Handles business logic for dataset metadata.
 *
 * Responsibilities:
 *   - Provide high‑level operations for controllers
 *   - Delegate database access to DatasetRepository
 *   - Validate and transform data if needed
 *
 * This service does NOT interact with time‑series rows.
 * It only manages dataset metadata (id, name, etc.).
 */

const datasetRepository = require('../repositories/datasetRepository');

class datasetService {
  /**
   * Returns all datasets.
   */
  async getAllDatasets() {
    return await datasetRepository.findAll();
  }

  /**
   * Returns a dataset by its numeric ID.
   */
  async getDatasetById(id) {
    return await datasetRepository.findById(id);
  }

  /**
   * Returns a dataset by its name (e.g., "sensor1").
   */
  async getDatasetByName(name) {
    return await datasetRepository.findByName(name);
  }

  /**
   * Creates a new dataset.
   */
  async createDataset(data) {
    return await datasetRepository.create(data);
  }
}

module.exports = new datasetService();
