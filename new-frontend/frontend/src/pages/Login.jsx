import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const inputRefs = useRef([]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("registeredUser"));

    if (!savedUser) {
      setMessage("No registered account found. Please sign up first.");
      setMessageType("error");
      return;
    }

    if (savedUser.email !== email || savedUser.password !== password) {
      setMessage("Invalid email or password.");
      setMessageType("error");
      return;
    }

    setMessage("");
    setStep(2);
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();

    const enteredCode = otp.join("");

    if (enteredCode.length !== 6) {
      setMessage("Please enter the 6-digit verification code.");
      setMessageType("error");
      return;
    }

    localStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("iot_auth", "true");

    setMessage("");
    navigate("/home");
  };

  const handleResendCode = () => {
    setMessage("A new verification code has been sent.");
    setMessageType("success");
  };

  const handleBackToLogin = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setMessage("");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <span>IoT</span>
        </div>

        {step === 1 ? (
          <>
            <h1>Welcome Back</h1>

            <p className="login-subtitle">
              Sign in to continue to Intelligent IoT Data Management.
            </p>

            {message && (
              <p
                className={`form-alert ${
                  messageType === "success" ? "success-alert" : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="login-button">
                Login
              </button>
            </form>

            <p className="signup-text">
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Two-Factor Authentication</h1>

            <p className="login-subtitle">
              Enter the 6-digit verification code sent to your email address.
            </p>

            {message && (
              <p
                className={`form-alert ${
                  messageType === "success" ? "success-alert" : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form className="login-form" onSubmit={handleVerifyCode}>
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </div>

              <button type="submit" className="login-button">
                Verify Code
              </button>
            </form>

            <div className="twofactor-actions">
              <button
                type="button"
                className="text-button"
                onClick={handleResendCode}
              >
                Resend Code
              </button>

              <button
                type="button"
                className="text-button"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Login;