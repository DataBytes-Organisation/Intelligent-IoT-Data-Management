import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useWebSocket from 'react-use-websocket';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/alerts');
  
  useEffect(() => {
    if (lastMessage !== null) {
      const alert = JSON.parse(lastMessage.data);
      setAlerts(prev => [...prev, alert]);
      
      // Show toast notification
      toast[alert.severity](`${alert.type}: ${alert.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
      });
    }
  }, [lastMessage]);
  
  return (
    <div className="alerts-panel">
      <h2>Active Alerts</h2>
      <div className="alerts-list">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert-item ${alert.severity}`}>
            <span className="alert-time">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
            <span className="alert-type">{alert.type}</span>
            <p className="alert-message">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;