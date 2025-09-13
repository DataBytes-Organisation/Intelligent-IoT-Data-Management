// hooks/useSensorData.js
import { useState, useEffect } from 'react';
import SensorData1 from '../data/sensorData1.json';

export const useSensorData = (useMock = false) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (useMock) {
      setData(SensorData1);
      setLoading(false);
      return;
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


    fetch('/api/sensor-data')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [useMock]);

  return { data, loading, error };
};
