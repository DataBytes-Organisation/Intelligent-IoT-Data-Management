import React from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LogoutPage from "./pages/LogoutPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";

import MainLayout from "./layouts/MainLayout.jsx";

export default function App() {
  return (
    <Routes>
      {/* Layout with Navbar */}
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
