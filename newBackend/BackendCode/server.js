//handles server setup and configuration for the Express backend

require('dotenv').config({ path: '../.env' }); //Load .env from root

const express = require('express');
const cors = require('cors');
const WebSocketServer = require('./websocketServer');

const mockRoutes = require('./routes/mock');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('IoT Data Management Backend is running');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      websocket: 'running'
    }
  });
});

//Mount mock routes
app.use('/api', mockRoutes);

//Start HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HTTP Server running on http://localhost:${PORT}`);
});

//Start WebSocket server
const wsServer = new WebSocketServer(8080);
wsServer.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  wsServer.stop();
  process.exit(0);
});