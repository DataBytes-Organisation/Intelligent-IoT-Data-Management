import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegistrationPage.css";

const RegistrationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    localStorage.setItem(
      "iotUser",
      JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
      })
    );

    localStorage.setItem("isAuthenticated", "true");

    setError("");
    navigate("/");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-badge">Intelligent IoT Platform</div>

        <h1 className="auth-title">Create Account</h1>

        <p className="auth-subtitle">
          Sign up to access the IoT sensor dashboard and analytics platform.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="auth-input"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="auth-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="auth-input"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="auth-input"
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-primary-btn">
            Sign Up
          </button>
        </form>

        <div className="auth-divider">
          <span></span>
          <p>Or continue with</p>
          <span></span>
        </div>

        <div className="auth-social-grid">
          <button type="button">Google</button>
          <button type="button">Microsoft</button>
          <button type="button">Apple</button>
        </div>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <span>Login page coming soon</span>
        </p>

        <Link to="/forgot-password" className="auth-link">
          Forgot password?
        </Link>
      </section>
    </main>
  );
};

export default RegistrationPage;