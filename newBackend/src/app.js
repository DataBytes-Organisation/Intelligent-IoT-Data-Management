const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const datasetsRoutes = require('./routes/datasetsRoutes');
const seriesRoutes = require('./routes/seriesRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConfig = require('./config/database');
    await dbConfig.query('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        server: 'running'
      }
    });
  }
});

// API Routes
app.use('/api', datasetsRoutes);
app.use('/api', seriesRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    code: 'not_found',
    message: 'Endpoint not found'
  });
});

module.exports = app;
