const { Pool } = require('pg');

class DatabaseConfig {
  constructor() {
    this.pool = this.createPool();
    this.setupEventHandlers();
  }

  createPool() {
    return new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  setupEventHandlers() {
    this.pool.on('connect', () => {
      console.log('New database connection established');
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Query executed:', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('Database pool closed');
  }
}

// Singleton instance
const dbConfig = new DatabaseConfig();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await dbConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await dbConfig.close();
  process.exit(0);
});

module.exports = dbConfig;