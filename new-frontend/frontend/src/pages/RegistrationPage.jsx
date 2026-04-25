import React, { useState } from 'react';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
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

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    console.log('Registration form data:', formData);
  };

  return (
    <center>
      <br />
      <br />
      <br />
      <br />

      <fieldset
        style={{
          width: '320px',
          padding: '30px 25px',
          borderRadius: '35px',
          textAlign: 'center'
        }}
      >
        <legend
          style={{
            padding: '0 12px',
            fontSize: '18px',
            fontWeight: '500'
          }}
        >
          Create Account
        </legend>

        <form onSubmit={handleSubmit}>
          <p>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid black',
                padding: '8px 10px',
                width: '220px'
              }}
            />
          </p>

          <p>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid black',
                padding: '8px 10px',
                width: '220px'
              }}
            />
          </p>

          <p>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid black',
                padding: '8px 10px',
                width: '220px'
              }}
            />
          </p>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <p>
            <button type="submit">Sign-up</button>
          </p>
        </form>
      </fieldset>
    </center>
  );
};

export default RegistrationPage;