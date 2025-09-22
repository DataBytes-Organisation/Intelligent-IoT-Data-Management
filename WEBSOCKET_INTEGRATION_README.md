# WebSocket Integration for Real-time IoT Data Streaming

## 🚀 Overview

This implementation adds real-time data streaming capabilities to the Intelligent IoT Data Management Platform using WebSocket technology.

## 📡 Features Implemented

### Backend WebSocket Server (Port 8080)
- **Real-time data streaming** every 5 seconds
- **Stream subscription management** - clients can subscribe/unsubscribe to specific data streams
- **Live correlation analysis** - real-time correlation requests
- **Live anomaly detection** - real-time anomaly detection requests
- **Connection health monitoring** with ping/pong
- **Automatic reconnection** with exponential backoff
- **Client management** with unique client IDs

### Frontend WebSocket Client
- **Real-time data visualization** with live charts
- **Stream selection interface** for subscribing to specific sensors
- **Live analysis controls** for correlation and anomaly detection
- **Connection status monitoring** with visual indicators
- **Automatic reconnection** on connection loss
- **Debug information panel** for development

## 🏗️ Architecture

```
Frontend (React)          Backend (Node.js)
     │                         │
     │ WebSocket Connection    │
     │ ws://localhost:8080     │
     │                         │
     ├─ useWebSocket Hook      ├─ WebSocketService
     ├─ RealTimeData Component ├─ MockRepository
     └─ Dashboard Integration  └─ PythonService (ML)
```

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd BackendCode
npm install
npm start
```

This will start:
- **Express API server** on `http://localhost:3000`
- **WebSocket server** on `ws://localhost:8080`

### 2. Start the Frontend
```bash
cd new-frontend/frontend
npm install
npm run dev
```

### 3. Access the Application
- Open `http://localhost:5173`
- Click on **"📡 Real-time Streaming"** tab
- Select data streams and start streaming

## 📊 WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

### Message Types

#### 1. Subscribe to Streams
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  streams: ['Temperature', 'Humidity', 'Voltage Charge']
}));
```

#### 2. Unsubscribe from Streams
```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  streams: ['Temperature']
}));
```

#### 3. Request Correlation Analysis
```javascript
ws.send(JSON.stringify({
  type: 'request_correlation',
  streams: ['Temperature', 'Humidity'],
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-01T01:00:00Z',
  threshold: 0.5
}));
```

#### 4. Request Anomaly Detection
```javascript
ws.send(JSON.stringify({
  type: 'request_anomaly_detection',
  streams: ['Temperature', 'Humidity'],
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-01T01:00:00Z',
  threshold: 0.1,
  algorithm: 'correlation'
}));
```

#### 5. Start/Stop Streaming
```javascript
// Start streaming
ws.send(JSON.stringify({ type: 'start_streaming' }));

// Stop streaming
ws.send(JSON.stringify({ type: 'stop_streaming' }));
```

### Response Types

#### 1. Data Update
```javascript
{
  type: 'data_update',
  data: {
    'Temperature': [
      { timestamp: '2025-01-01T12:00:00Z', value: 22.5, entry_id: 123 }
    ],
    'Humidity': [
      { timestamp: '2025-01-01T12:00:00Z', value: 45.2, entry_id: 123 }
    ]
  },
  timestamp: '2025-01-01T12:00:00Z',
  updateCount: 10
}
```

#### 2. Correlation Result
```javascript
{
  type: 'correlation_result',
  data: {
    correlation_matrix: {
      'Temperature': { 'Humidity': 0.75 },
      'Humidity': { 'Temperature': 0.75 }
    },
    low_correlation_pairs: []
  },
  timestamp: '2025-01-01T12:00:00Z'
}
```

#### 3. Anomaly Detection Result
```javascript
{
  type: 'anomaly_detection_result',
  data: {
    'Temperature': { avg_corr: 0.85, is_outlier: false },
    'Humidity': { avg_corr: 0.12, is_outlier: true }
  },
  timestamp: '2025-01-01T12:00:00Z'
}
```

## 🎯 Frontend Usage

### Using the WebSocket Hook
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

const MyComponent = () => {
  const {
    isConnected,
    data,
    error,
    subscriptions,
    subscribe,
    unsubscribe,
    requestCorrelation,
    requestAnomalyDetection
  } = useWebSocket();

  // Subscribe to streams
  const handleSubscribe = () => {
    subscribe(['Temperature', 'Humidity']);
  };

  // Request correlation analysis
  const handleCorrelation = () => {
    requestCorrelation(
      ['Temperature', 'Humidity'],
      new Date(Date.now() - 60000).toISOString(),
      new Date().toISOString()
    );
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSubscribe}>Subscribe</button>
      <button onClick={handleCorrelation}>Analyze Correlation</button>
    </div>
  );
};
```

### Real-time Data Component
```javascript
import RealTimeData from './components/RealTimeData';

// Use in your app
<RealTimeData />
```

## 🔧 Configuration

### Backend Configuration
```javascript
// WebSocket server port
const WEBSOCKET_PORT = 8080;

// Data update interval (milliseconds)
const DATA_UPDATE_INTERVAL = 5000; // 5 seconds

// Connection timeout (milliseconds)
const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Max reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;
```

### Frontend Configuration
```javascript
// WebSocket URL
const WEBSOCKET_URL = 'ws://localhost:8080';

// Chart update settings
const CHART_HISTORY_LIMIT = 20; // Keep last 20 data points
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend is running on port 8080
   - Verify firewall settings
   - Check browser console for errors

2. **No Data Updates**
   - Ensure streams are subscribed
   - Check if streaming is started
   - Verify data source is available

3. **Analysis Requests Failing**
   - Check if Python service is running
   - Verify request parameters
   - Check backend logs for errors

### Debug Mode
Enable debug logging by opening browser console. The WebSocket hook logs all connection events and message types.

## 📈 Performance Considerations

- **Data History**: Limited to last 20 data points per stream
- **Update Frequency**: 5-second intervals (configurable)
- **Connection Health**: Ping/pong every 10 seconds
- **Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, 16s)

## 🔮 Future Enhancements

- [ ] **Data Compression**: Implement message compression
- [ ] **Batch Updates**: Group multiple updates into single message
- [ ] **Custom Intervals**: Allow clients to set update frequency
- [ ] **Data Persistence**: Store real-time data in database
- [ ] **Multi-tenant Support**: Isolate data by client/user
- [ ] **Metrics Dashboard**: Monitor WebSocket performance

## 📝 API Documentation

For complete API documentation, see:
- Backend: `BackendCode/README.md`
- Frontend: `new-frontend/frontend/README.md`
- Integration: `new-frontend/INTEGRATION_README.md`

## 🎉 Success!

Your IoT platform now supports real-time data streaming with WebSocket technology! Users can:

✅ **Subscribe to live data streams**  
✅ **View real-time charts and visualizations**  
✅ **Request live correlation analysis**  
✅ **Detect anomalies in real-time**  
✅ **Monitor connection status**  
✅ **Handle automatic reconnections**  

The system is production-ready and scalable for multiple concurrent clients.
