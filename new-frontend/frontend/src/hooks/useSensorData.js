import { useState, useEffect } from 'react';
import SensorData1 from '../data/sensorData1.json';

export const useSensorData = (useMock = true, endpoint = '/api/streams') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (useMock) {
      setData(SensorData1);
      setLoading(false);
      return;
    }

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [useMock, endpoint]);

  return { data, loading, error };
};