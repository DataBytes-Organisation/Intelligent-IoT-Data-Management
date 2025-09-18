import React from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LogoutPage from "./pages/LogoutPage.jsx";   // <- check name & casing
import Dashboard from "./pages/DashboardPage.jsx"; // <- matches your file

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />  {/* public */}

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
