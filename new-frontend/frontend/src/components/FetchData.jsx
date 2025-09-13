import React from 'react';
import SensorData1 from '../data/sensorData1.json'; 
import './FetchData.css';
import { useSensorData } from '../hooks/useSensorData';

const FetchData = () => {
  const { data, loading, error } = useSensorData(true); // toggle to false for API

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  return (
<>
  <h1 className='useFetch_heading'>Use Fetch Custom Hook</h1>
  <ul className='list_data_main'>
    {data && data.map((e, index) => (
      <li key={index} className='list_data'>
        <h3>{e.created_at}</h3>
        <p><strong>entry_id: </strong>{e.entry_id}</p>
        <p><strong>field1: </strong>{e.field1}</p>
        <p><strong>field2: </strong>{e.field2}</p>
        <p><strong>field3: </strong>{e.field3}</p>
        <p><strong>field4: </strong>{e.field4}</p>
        <p><strong>field5: </strong>{e.field5}</p>
        <p><strong>field6: </strong>{e.field6}</p>
        <p><strong>field7: </strong>{e.field7}</p>
        <p><strong>field8: </strong>{e.field8}</p>
      </li>
    ))}
  </ul>
</>
  );
};

export default FetchData;