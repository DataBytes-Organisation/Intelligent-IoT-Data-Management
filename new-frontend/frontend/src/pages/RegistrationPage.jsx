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

  const inputStyle = {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 12px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px'
  };

  const socialButtonStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '120px'
      }}
    >
      <div
        style={{
          width: '560px',
          padding: '28px 30px',
          border: '1px solid #d1d5db',
          borderRadius: '28px',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}
      >
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827'
          }}
        >
          Create Account
        </h2>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          Sign up to access your dashboard
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              width: '330px',
              margin: '0 auto 16px auto'
            }}
          >
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: '12px', marginBottom: '18px' }}>
            <button
              type="submit"
              style={{
                width: '180px',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#111827',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '18px 0 18px 0'
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }}></div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }}></div>
          </div>

          <div
            style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px'
            }}
          >
            <button type="button" style={socialButtonStyle}>
              Google
            </button>
            
            <button type="button" style={socialButtonStyle}>
              Microsoft
            </button>
            
            <button type="button" style={socialButtonStyle}>
              Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;