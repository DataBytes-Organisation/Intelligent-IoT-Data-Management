const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'appdb',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT,10) : 5432,
  max: 10,
  idleTimeoutMillis: 30000
});

module.exports = pool;
