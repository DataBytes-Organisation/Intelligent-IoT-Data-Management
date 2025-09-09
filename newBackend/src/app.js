const express = require('express');
const cors = require('cors');

const logger = require('./middleware/logger');
const apiRouter = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// Root ping
app.get('/', (_req, res) => res.send('Backend is running'));

// Mount /api routes
app.use('/api', apiRouter);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ code: 'not_found', message: 'route not found' });
});

module.exports = app;
