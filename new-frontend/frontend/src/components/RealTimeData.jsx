import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RealTimeData = () => {
  const {
    isConnected,
    data,
    error,
    subscriptions,
    subscribe,
    unsubscribe,
    requestCorrelation,
    requestAnomalyDetection,
    startStreaming,
    stopStreaming
  } = useWebSocket();

  const [selectedStreams, setSelectedStreams] = useState([]);
  const [streamHistory, setStreamHistory] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);

  // Available streams for selection
  const availableStreams = [
    'Temperature',
    'Humidity', 
    'Voltage Charge',
    'Current Draw',
    'Light Index',
    'Atmosphere'
  ];

  // Handle stream selection
  const handleStreamToggle = (stream) => {
    const newSelectedStreams = selectedStreams.includes(stream)
      ? selectedStreams.filter(s => s !== stream)
      : [...selectedStreams, stream];
    
    setSelectedStreams(newSelectedStreams);
    
    if (newSelectedStreams.length > 0) {
      subscribe(newSelectedStreams);
    } else {
      unsubscribe(selectedStreams);
    }
  };

  // Handle streaming toggle
  const handleStreamingToggle = () => {
    if (isStreaming) {
      stopStreaming();
      setIsStreaming(false);
    } else {
      startStreaming();
      setIsStreaming(true);
    }
  };

  // Update stream history when new data arrives
  useEffect(() => {
    if (data && data.lastUpdate) {
      setStreamHistory(prev => {
        const newHistory = { ...prev };
        
        Object.keys(data).forEach(stream => {
          if (stream !== 'lastUpdate' && stream !== 'correlationResult' && stream !== 'anomalyResult') {
            if (!newHistory[stream]) {
              newHistory[stream] = [];
            }
            
            // Add new data point
            newHistory[stream].push({
              timestamp: data[stream][0]?.timestamp || new Date().toISOString(),
              value: data[stream][0]?.value || 0
            });
            
            // Keep only last 20 data points
            if (newHistory[stream].length > 20) {
              newHistory[stream] = newHistory[stream].slice(-20);
            }
          }
        });
        
        return newHistory;
      });
    }
  }, [data]);

  // Prepare chart data
  const chartData = {
    labels: selectedStreams.length > 0 && streamHistory[selectedStreams[0]] 
      ? streamHistory[selectedStreams[0]].map(point => 
          new Date(point.timestamp).toLocaleTimeString()
        )
      : [],
    datasets: selectedStreams.map((stream, index) => ({
      label: stream,
      data: streamHistory[stream]?.map(point => point.value) || [],
      borderColor: `hsl(${index * 60}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      borderWidth: 2
    }))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Real-time IoT Sensor Data',
        font: { size: 16 }
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value'
        }
      }
    },
    animation: {
      duration: 0 // Disable animation for real-time updates
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Real-time IoT Data Streaming</h2>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24'
      }}>
        <strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {error && <div style={{ marginTop: '5px' }}>Error: {error}</div>}
      </div>

      {/* Stream Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Data Streams:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {availableStreams.map(stream => (
            <label key={stream} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={selectedStreams.includes(stream)}
                onChange={() => handleStreamToggle(stream)}
              />
              {stream}
            </label>
          ))}
        </div>
      </div>

      {/* Streaming Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleStreamingToggle}
          style={{
            padding: '10px 20px',
            backgroundColor: isStreaming ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isStreaming ? '⏹️ Stop Streaming' : '▶️ Start Streaming'}
        </button>
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Subscribed to: {subscriptions.length > 0 ? subscriptions.join(', ') : 'None'}
        </div>
      </div>

      {/* Real-time Chart */}
      {selectedStreams.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ height: '400px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Analysis Controls */}
      {selectedStreams.length >= 2 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Real-time Analysis:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => requestCorrelation(
                selectedStreams,
                new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                new Date().toISOString()
              )}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🔗 Request Correlation
            </button>
            
            <button
              onClick={() => requestAnomalyDetection(
                selectedStreams,
                new Date(Date.now() - 60000).toISOString(),
                new Date().toISOString()
              )}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ⚠️ Detect Anomalies
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {data.correlationResult && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '5px' 
        }}>
          <h4>Correlation Analysis Result:</h4>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(data.correlationResult, null, 2)}
          </pre>
        </div>
      )}

      {data.anomalyResult && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '5px' 
        }}>
          <h4>Anomaly Detection Result:</h4>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(data.anomalyResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Data Debug Info */}
      <details style={{ marginTop: '20px' }}>
        <summary>Debug Information</summary>
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <div><strong>Last Update:</strong> {data.lastUpdate || 'Never'}</div>
          <div><strong>Stream History Count:</strong> {Object.keys(streamHistory).length}</div>
          <div><strong>Raw Data:</strong></div>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default RealTimeData;
