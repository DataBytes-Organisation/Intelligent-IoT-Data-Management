// WebSocket service for real-time data streaming and live updates

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const MockRepository = require('../repositories/mockRepository');
const { analyze, analyzeCorr } = require('./pythonService');

class WebSocketService {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, subscriptions }
    this.mockRepository = new MockRepository();
    this.dataInterval = null;
    this.isStreaming = false;
  }

  // Initialize WebSocket server
  initialize() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      perMessageDeflate: false 
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      console.log(`🔌 New WebSocket client connected: ${clientId}`);
      
      // Store client connection
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        lastPing: Date.now()
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        clientId,
        message: 'Connected to IoT Data Stream',
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        
        // Stop streaming if no clients
        if (this.clients.size === 0) {
          this.stopDataStreaming();
        }
      });

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });
    });

    // Start ping interval to check connection health
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (Date.now() - client.lastPing > 30000) { // 30 seconds timeout
          console.log(`🔌 Client ${clientId} timed out, closing connection`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else {
          client.ws.ping();
        }
      });
    }, 10000); // Ping every 10 seconds

    console.log(`🚀 WebSocket server running on ws://localhost:${this.port}`);
  }

  // Handle incoming WebSocket messages
  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        this.handleSubscription(clientId, data);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(clientId, data);
        break;
      
      case 'request_correlation':
        this.handleCorrelationRequest(clientId, data);
        break;
      
      case 'request_anomaly_detection':
        this.handleAnomalyDetectionRequest(clientId, data);
        break;
      
      case 'start_streaming':
        this.startDataStreaming();
        break;
      
      case 'stop_streaming':
        this.stopDataStreaming();
        break;
      
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${data.type}`,
          timestamp: new Date().toISOString()
        });
    }
  }

  // Handle stream subscription
  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { streams } = data;
    if (Array.isArray(streams)) {
      streams.forEach(stream => client.subscriptions.add(stream));
      
      this.sendToClient(clientId, {
        type: 'subscription_confirmed',
        streams: Array.from(client.subscriptions),
        message: 'Successfully subscribed to streams',
        timestamp: new Date().toISOString()
      });

      // Start streaming if not already started
      if (!this.isStreaming) {
        this.startDataStreaming();
      }
    }
  }

  // Handle stream unsubscription
  handleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { streams } = data;
    if (Array.isArray(streams)) {
      streams.forEach(stream => client.subscriptions.delete(stream));
      
      this.sendToClient(clientId, {
        type: 'unsubscription_confirmed',
        streams: Array.from(client.subscriptions),
        message: 'Successfully unsubscribed from streams',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle correlation analysis request
  async handleCorrelationRequest(clientId, data) {
    try {
      const { streams, startDate, endDate, threshold } = data;
      
      const result = await analyzeCorr({
        streams,
        start_date: startDate,
        end_date: endDate,
        threshold: threshold || 0.5
      });

      this.sendToClient(clientId, {
        type: 'correlation_result',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Correlation analysis error:', error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to perform correlation analysis',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle anomaly detection request
  async handleAnomalyDetectionRequest(clientId, data) {
    try {
      const { streams, startDate, endDate, threshold, algorithm } = data;
      
      const result = await analyze({
        streams,
        start_date: startDate,
        end_date: endDate,
        threshold: threshold || 0.1,
        algo_type: algorithm || 'correlation'
      });

      this.sendToClient(clientId, {
        type: 'anomaly_detection_result',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Anomaly detection error:', error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to perform anomaly detection',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Start real-time data streaming
  startDataStreaming() {
    if (this.isStreaming) return;
    
    this.isStreaming = true;
    console.log('📡 Starting real-time data streaming...');
    
    this.dataInterval = setInterval(() => {
      this.broadcastDataUpdate();
    }, 5000); // Update every 5 seconds
  }

  // Stop real-time data streaming
  stopDataStreaming() {
    if (!this.isStreaming) return;
    
    this.isStreaming = false;
    console.log('📡 Stopping real-time data streaming...');
    
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }
  }

  // Broadcast data update to all subscribed clients
  broadcastDataUpdate() {
    if (this.clients.size === 0) return;

    try {
      // Get fresh data from repository
      const allData = this.mockRepository.getMockData();
      const latestData = allData.slice(-10); // Get last 10 data points
      
      // Group data by streams
      const streamData = {};
      latestData.forEach(entry => {
        Object.keys(entry).forEach(key => {
          if (key !== 'created_at' && key !== 'entry_id' && key !== 'was_interpolated') {
            if (!streamData[key]) {
              streamData[key] = [];
            }
            streamData[key].push({
              timestamp: entry.created_at,
              value: entry[key],
              entry_id: entry.entry_id
            });
          }
        });
      });

      // Send data to subscribed clients
      this.clients.forEach((client, clientId) => {
        if (client.subscriptions.size > 0) {
          const subscribedData = {};
          client.subscriptions.forEach(stream => {
            if (streamData[stream]) {
              subscribedData[stream] = streamData[stream];
            }
          });

          this.sendToClient(clientId, {
            type: 'data_update',
            data: subscribedData,
            timestamp: new Date().toISOString(),
            updateCount: latestData.length
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting data update:', error);
    }
  }

  // Send message to specific client
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  // Broadcast message to all clients
  broadcast(message) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  // Get server status
  getStatus() {
    return {
      isRunning: this.wss !== null,
      port: this.port,
      clientCount: this.clients.size,
      isStreaming: this.isStreaming,
      clients: Array.from(this.clients.keys())
    };
  }

  // Close WebSocket server
  close() {
    this.stopDataStreaming();
    if (this.wss) {
      this.wss.close();
      console.log('🔌 WebSocket server closed');
    }
  }
}

module.exports = WebSocketService;
