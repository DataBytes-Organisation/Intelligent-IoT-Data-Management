import React, { useContext } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import FetchData from "./components/FetchData";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./auth/AuthContext";

export default function App() {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ marginRight: "auto" }}>IoT Sensors Dashboard</h1>
        <Link to="/">Home</Link>
        <Link to="/sensorData1">Sensor Data</Link>
        {isAuthenticated ? (
          <>
            <span style={{ opacity: 0.7 }}>Hi, {user?.name || "user"}</span>
            <Link to="/logout">Logout</Link>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </header>

      <h3>Time-series Sensor Data and Correlation Analysis</h3>

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sensorData1"
          element={
            <ProtectedRoute>
              <FetchData />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:id"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </div>
  );
}
