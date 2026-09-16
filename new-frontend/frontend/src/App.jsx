import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import DeveloperMetricsPage from "./pages/DeveloperMetricsPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
  path="/home"
  element={
    <Layout>
      <HomePage />
    </Layout>
  }
/>
<Route
  path="/developer-metrics/:id"
  element={
    <Layout>
      <DeveloperMetricsPage />
    </Layout>
  }
/>
        <Route
  path="/dashboard/:id"
  element={
    <Layout>
      <DashboardPage />
    </Layout>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;