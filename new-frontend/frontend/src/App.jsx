import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'chartjs-adapter-date-fns';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';

// import DashboardLearn from './components/DashboardLearn'; //for learning 

import FetchData from './components/FetchData';



function App() {
  return (
    <BrowserRouter>
      <div>
        <h1>IoT Sensors Dashboard</h1>
        <h3>Time-series Sensor Data and Correlation Analysis</h3>
        <Routes>
          
          
          <Route path="/sensorData1" element={<FetchData />} /> 
          <Route path="/" element={<HomePage />} /> 
          <Route path="/dashboard/:id" element={<DashboardPage />} />

                  
        </Routes>
      </div>
    </BrowserRouter>
  );
}



export default App;
