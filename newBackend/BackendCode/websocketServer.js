// WebSocket server for real-time data streaming
const WebSocket = require('ws');
const { getAvailableStreamNames } = require('./services/mockService');

class WebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.intervalId = null;
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);
      
      // Send initial data
      this.sendInitialData(ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    
    console.log(`WebSocket server running on port ${this.port}`);
    
    // Start broadcasting data updates
    this.startDataBroadcast();
  }

  sendInitialData(ws) {
    try {
      const streamNames = getAvailableStreamNames();
      ws.send(JSON.stringify({
        type: 'initial_data',
        streams: streamNames,
        message: 'Connected to IoT Data Management Platform'
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe_streams':
        this.handleStreamSubscription(ws, data);
        break;
      case 'request_correlation':
        this.handleCorrelationRequest(ws, data);
        break;
      case 'request_anomaly_detection':
        this.handleAnomalyDetectionRequest(ws, data);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  handleStreamSubscription(ws, data) {
    const { streams } = data;
    ws.subscribedStreams = streams;
    
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      streams: streams,
      message: `Subscribed to streams: ${streams.join(', ')}`
    }));
  }

  handleCorrelationRequest(ws, data) {
    // This would integrate with the correlation analysis service
    ws.send(JSON.stringify({
      type: 'correlation_analysis',
      message: 'Correlation analysis request received',
      data: data
    }));
  }

  handleAnomalyDetectionRequest(ws, data) {
    // This would integrate with the anomaly detection service
    ws.send(JSON.stringify({
      type: 'anomaly_detection',
      message: 'Anomaly detection request received',
      data: data
    }));
  }

  startDataBroadcast() {
    // Broadcast data updates every 5 seconds
    this.intervalId = setInterval(() => {
      this.broadcastDataUpdate();
    }, 5000);
  }

  broadcastDataUpdate() {
    if (this.clients.size === 0) return;
    
    const updateData = {
      type: 'data_update',
      timestamp: new Date().toISOString(),
      message: 'Real-time data update',
      active_connections: this.clients.size
    };
    
    const message = JSON.stringify(updateData);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('WebSocket server stopped');
  }
}

module.exports = WebSocketServer;
