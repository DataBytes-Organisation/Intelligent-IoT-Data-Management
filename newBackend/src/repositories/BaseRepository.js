const dbConfig = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    this.db = dbConfig;
    this.tableName = tableName;
  }

  async findAll(conditions = {}, orderBy = null, limit = null) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    let paramIndex = 1;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = $${paramIndex++}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(limit);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async executeQuery(query, params = []) {
    const result = await this.db.query(query, params);
    return result.rows;
  }
}

module.exports = BaseRepository;