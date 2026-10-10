class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }
}

module.exports = BaseRepository;
