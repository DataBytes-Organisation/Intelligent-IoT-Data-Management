import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "chartjs-adapter-date-fns";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";

// import DashboardLearn from './components/DashboardLearn'; //for learning

import FetchData from "./components/FetchData";

function App() {
  return (
    <BrowserRouter>
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            IoT Sensors Dashboard
          </h1>
          <p className="text-blue-600 font-medium">
            Time-series Sensor Data and Correlation Analysis
          </p>
          <p className="text-gray-600 text-sm">Dashboard for Sensor 1</p>
        </div>
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
