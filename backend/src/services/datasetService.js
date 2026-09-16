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

const datasetRepository = require("../repositories/datasetRepository");
const { importDataset, updateDataset } = require("./datasetImportService");

const configurationError = (message) =>
  Object.assign(new Error(message), {
    code: "DATASET_CONFIGURATION_ERROR",
    status: 500,
  });

function getThingSpeakDatasetOwnerId() {
  const ownerId = process.env.THINGSPEAK_DATASET_OWNER_ID;
  if (!ownerId) {
    throw configurationError(
      "THINGSPEAK_DATASET_OWNER_ID is required to list shared ThingSpeak data.",
    );
  }
  return ownerId;
}

class datasetService {
  /**
   * Returns all datasets accessible to the given user, filtered by status.
   */
  async getAllDatasets(status, userId) {
    return await datasetRepository.findAll(
      status,
      userId,
      getThingSpeakDatasetOwnerId(),
    );
  }
  async restoreDataset(datasetId, user) {
    return await datasetRepository.restoreDataset(
      datasetId,
      user,
      getThingSpeakDatasetOwnerId()
    );
  }

  /**
   * Returns a dataset by its numeric ID.
   */
  async getDatasetById(id, userId) {
    return await datasetRepository.findById(
      id,
      userId,
      getThingSpeakDatasetOwnerId(),
    );
  }

  /**
   * Returns a dataset by its name (e.g., "sensor1").
   */
  async getDatasetByName(name, userId) {
    return await datasetRepository.findByName(name, userId);
  }

  /**
   * Creates a new dataset.
   */
  async createDataset(data) {
    return await datasetRepository.create(data);
  }

  async importDataset(data, userId) {
    return importDataset(data, userId, datasetRepository);
  }

  async updateDataset(id, data, user) {
    return updateDataset(id, data, user, datasetRepository);
  }

  async deleteDataset(id, user) {
    return datasetRepository.deleteDataset(
      id,
      user,
      getThingSpeakDatasetOwnerId(),
    );
  }
}

module.exports = new datasetService();
