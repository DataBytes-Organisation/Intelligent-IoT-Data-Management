/**
 * DATASET REPOSITORY
 * -------------------
 * Handles all database operations related to dataset metadata.
 *
 * Responsibilities:
 *   - Fetch all datasets
 *   - Fetch a dataset by ID
 *   - Insert a new dataset
 *
 * This repository does NOT interact with time‑series rows.
 */

const db = require('../db/pool'); // pg Pool instance

class DatasetRepository {
  async findAll() {
    const result = await db.query(`
      SELECT id, name
      FROM datasets
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      `
      SELECT id, name
      FROM datasets
      WHERE id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const result = await db.query(
      `
      SELECT id, name
      FROM datasets
      WHERE name = $1
      `,
      [name]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const { name } = data;

    const result = await db.query(
      `
      INSERT INTO datasets (name)
      VALUES ($1)
      RETURNING id, name
      `,
      [name]
    );

    return result.rows[0];
  }
}

module.exports = new DatasetRepository();

