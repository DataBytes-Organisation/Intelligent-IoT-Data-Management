// WebSocket hook for real-time data streaming

import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8080';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL);
      
      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Resubscribe to previous subscriptions
        if (subscriptions.size > 0) {
          subscribe(Array.from(subscriptions));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`🔄 Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setError('Failed to connect to WebSocket server');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [subscriptions]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'connection':
        console.log('Connected to IoT Data Stream:', message.message);
        break;
        
      case 'data_update':
        setData(prevData => ({
          ...prevData,
          ...message.data,
          lastUpdate: message.timestamp
        }));
        break;
        
      case 'subscription_confirmed':
        console.log('Subscribed to streams:', message.streams);
        setSubscriptions(new Set(message.streams));
        break;
        
      case 'unsubscription_confirmed':
        console.log('Unsubscribed from streams:', message.streams);
        setSubscriptions(new Set(message.streams));
        break;
        
      case 'correlation_result':
        setData(prevData => ({
          ...prevData,
          correlationResult: message.data,
          correlationTimestamp: message.timestamp
        }));
        break;
        
      case 'anomaly_detection_result':
        setData(prevData => ({
          ...prevData,
          anomalyResult: message.data,
          anomalyTimestamp: message.timestamp
        }));
        break;
        
      case 'error':
        console.error('WebSocket error:', message.message);
        setError(message.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Send message to WebSocket server
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Subscribe to data streams
  const subscribe = useCallback((streams) => {
    if (Array.isArray(streams) && streams.length > 0) {
      sendMessage({
        type: 'subscribe',
        streams
      });
    }
  }, [sendMessage]);

  // Unsubscribe from data streams
  const unsubscribe = useCallback((streams) => {
    if (Array.isArray(streams) && streams.length > 0) {
      sendMessage({
        type: 'unsubscribe',
        streams
      });
    }
  }, [sendMessage]);

  // Request correlation analysis
  const requestCorrelation = useCallback((streams, startDate, endDate, threshold = 0.5) => {
    sendMessage({
      type: 'request_correlation',
      streams,
      startDate,
      endDate,
      threshold
    });
  }, [sendMessage]);

  // Request anomaly detection
  const requestAnomalyDetection = useCallback((streams, startDate, endDate, threshold = 0.1, algorithm = 'correlation') => {
    sendMessage({
      type: 'request_anomaly_detection',
      streams,
      startDate,
      endDate,
      threshold,
      algorithm
    });
  }, [sendMessage]);

  // Start data streaming
  const startStreaming = useCallback(() => {
    sendMessage({ type: 'start_streaming' });
  }, [sendMessage]);

  // Stop data streaming
  const stopStreaming = useCallback(() => {
    sendMessage({ type: 'stop_streaming' });
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    data,
    error,
    subscriptions: Array.from(subscriptions),
    subscribe,
    unsubscribe,
    requestCorrelation,
    requestAnomalyDetection,
    startStreaming,
    stopStreaming,
    reconnect: connect
  };
};
