// hooks/useSensorData.js
import { useState, useEffect } from 'react';
import SensorData1 from '../data/sensorData1.json';
import { fetchStreams } from '../services/sensorApi.js';

export const useSensorData = (useMock = false) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    if (useMock) {
      setData(SensorData1);
      setLoading(false);
      return () => controller.abort();
    }

//     if (useMock) {
//   const wrapped = {
//     id: 'sensor1',
//     name: 'Mock Sensor 1',
//     data: SensorData1
//   };
//   setData(wrapped.data);
//   setLoading(false);
//   return;
// }

    fetchStreams({ signal: controller.signal })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          return;
        }

        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
  }, [useMock]);

  return { data, loading, error };
};
