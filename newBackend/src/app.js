// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const datasetsRoutes = require('./routes/datasetsRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const db = require('./config/database'); // pg pool

const app = express();

// Global Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      services: { database: 'connected', server: 'running' }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      services: { database: 'disconnected', server: 'running' }
    });
  }
});

// ✅ Only real API routes now
app.use('/api/datasets', datasetsRoutes);
app.use('/api/series', seriesRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
