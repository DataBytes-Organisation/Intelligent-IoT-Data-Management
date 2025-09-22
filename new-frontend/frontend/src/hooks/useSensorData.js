// hooks/useSensorData.js
import { useState, useEffect } from 'react';
import SensorData1 from '../data/sensorData1.json';
import apiService from '../services/api';

export const useSensorData = (useMock = false) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (useMock) {
          setData(SensorData1);
          setLoading(false);
          return;
        }

        // Use backend API
        const response = await apiService.getStreams();
        setData(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        setError(err.message || 'Failed to fetch sensor data');
        setLoading(false);
        
        // Fallback to mock data on error
        if (!useMock) {
          console.log('Falling back to mock data due to API error');
          setData(SensorData1);
          setError(null);
        }
      }
    };

    fetchData();
  }, [useMock]);

  return { data, loading, error };
};
