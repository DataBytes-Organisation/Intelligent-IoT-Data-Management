//handles server setup and configuration for the Express backend

require('dotenv').config({ path: '../.env' }); //Load .env from root

const express = require('express');
const cors = require('cors');
const WebSocketService = require('./services/websocketService');

const mockRoutes = require('./routes/mock');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    websocket: websocketService.getStatus()
  });
});

//Mount mock routes
app.use('/api', mockRoutes);

//Start Express server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});

//Initialize WebSocket server
const websocketService = new WebSocketService(8080);
websocketService.initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  websocketService.close();
  server.close(() => {
    console.log('✅ Servers closed gracefully');
    process.exit(0);
  });
});

module.exports = app;