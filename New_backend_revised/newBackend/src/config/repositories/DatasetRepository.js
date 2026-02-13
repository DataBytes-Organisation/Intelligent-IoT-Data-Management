const BaseRepository = require('./BaseRepository');

class DatasetRepository extends BaseRepository {
  constructor(db) {
    super('datasets', db);
    this.db = db;
  }

  async getAllDatasets() {
    const query = `
      SELECT id, name, description, created_at
      FROM datasets
      ORDER BY name;
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

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
