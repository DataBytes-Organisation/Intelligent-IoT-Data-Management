// src/repositories/DatasetRepository.js
const BaseRepository = require('./BaseRepository');

class DatasetRepository extends BaseRepository {
  constructor(db) {
    super('datasets', db);
    this.db = db; // Explicit assignment ensures clarity
  }

  /**
   * Get all datasets
   * Returns: [{ id, name, description, created_at }]
   */
  async getAllDatasets() {
    const query = `
      SELECT id, name, description, created_at
      FROM datasets
      ORDER BY name;
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Find dataset by name
   * @param {string} name
   * Returns: { id, name } or null
   */
  async findDatasetByName(name) {
    const query = `
      SELECT id, name
      FROM datasets
      WHERE name = $1
      LIMIT 1;
    `;
    const result = await this.db.query(query, [name]);
    return result.rows[0] || null;
  }

  /**
   * Get distinct metrics (fields) for a dataset
   * @param {number} datasetId
   * Returns: [{ metric }]
   */
  async getDatasetFields(datasetId) {
    const query = `
      SELECT DISTINCT metric
      FROM timeseries_long
      WHERE dataset_id = $1
      ORDER BY metric;
    `;
    const result = await this.db.query(query, [datasetId]);
    return result.rows;
  }

  /**
   * Get time bounds (min/max ts) for a dataset
   * @param {number} datasetId
   * Returns: { start, end }
   */
  async getDatasetTimeBounds(datasetId) {
    const query = `
      SELECT MIN(ts) AS start, MAX(ts) AS "end"
      FROM timeseries_long
      WHERE dataset_id = $1;
    `;
    const result = await this.db.query(query, [datasetId]);
    return result.rows[0] || { start: null, end: null };
  }
}

module.exports = DatasetRepository;
