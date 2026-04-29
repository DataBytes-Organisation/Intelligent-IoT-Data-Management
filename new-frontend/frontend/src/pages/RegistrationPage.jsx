import React, { useState } from 'react';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
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
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    console.log('Registration form data:', formData);
  };

  return (
    <div className="registration-page">
      <div className="registration-card">
        <h2 className="registration-title">Create Account</h2>

        <p className="registration-subtitle">
          Sign up to access your dashboard
        </p>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-input-group">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="registration-input"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="registration-input"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="registration-input"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="registration-input"
            />
          </div>

          {error && <p className="registration-error">{error}</p>}

          <div className="registration-submit-wrapper">
            <button type="submit" className="registration-submit-button">
              Sign Up
            </button>
          </div>

          <div className="registration-divider">
            <div className="registration-divider-line"></div>
            <span className="registration-divider-text">Or</span>
            <div className="registration-divider-line"></div>
          </div>

          <div className="registration-social-grid">
            <button type="button" className="registration-social-button">
              Google
            </button>

            <button type="button" className="registration-social-button">
              Microsoft
            </button>

            <button type="button" className="registration-social-button">
              Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;