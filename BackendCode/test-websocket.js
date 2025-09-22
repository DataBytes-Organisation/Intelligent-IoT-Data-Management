// Simple WebSocket client test script

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Integration...');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Test subscription
  ws.send(JSON.stringify({
    type: 'subscribe',
    streams: ['Temperature', 'Humidity']
  }));
  
  // Test correlation request
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'request_correlation',
      streams: ['Temperature', 'Humidity'],
      startDate: new Date(Date.now() - 60000).toISOString(),
      endDate: new Date().toISOString(),
      threshold: 0.5
    }));
  }, 2000);
  
  // Test anomaly detection
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'request_anomaly_detection',
      streams: ['Temperature', 'Humidity'],
      startDate: new Date(Date.now() - 60000).toISOString(),
      endDate: new Date().toISOString(),
      threshold: 0.1,
      algorithm: 'correlation'
    }));
  }, 4000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('📨 Received:', message.type);
  
  if (message.type === 'data_update') {
    console.log('📊 Data update received for streams:', Object.keys(message.data));
  }
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('🛑 Closing test connection...');
  ws.close();
  process.exit(0);
}, 10000);
