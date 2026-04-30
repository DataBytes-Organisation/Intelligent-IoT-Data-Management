import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'chartjs-adapter-date-fns';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import FetchData from './components/FetchData';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sensorData1" element={<FetchData />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard/:id" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;