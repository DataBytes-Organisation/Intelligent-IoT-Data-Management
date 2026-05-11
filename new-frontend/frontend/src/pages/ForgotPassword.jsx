import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const sendResetLink = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("");
        setStep(2);
      } else {
        setMessage(data.error || "Unable to send reset link.");
      }
    } catch (error) {
      setMessage("Backend connection failed. Please try again later.");
    }
  };

  const resetPassword = (e) => {
    e.preventDefault();

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }

    if (!passwordPattern.test(newPassword)) {
      setMessage(
        "Password must contain 8 characters, uppercase, lowercase, number and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password must match.");
      return;
    }

    setMessage("");
    setStep(4);
  };

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-icon">🔐</div>

        {step === 1 && (
          <>
            <h1 className="forgot-title">Forgot Password?</h1>
            <p className="forgot-text">
              Enter your email address and we will send you a password reset link.
            </p>

            <form className="forgot-form" onSubmit={sendResetLink}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="forgot-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button type="submit" className="forgot-primary-btn">
                Send Reset Link
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="forgot-title">Check Your Email</h1>
            <p className="forgot-text">
              A password reset link has been sent to your email address.
            </p>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="forgot-primary-btn"
            >
              Continue to Reset Password
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="forgot-title">Reset Password</h1>
            <p className="forgot-text">Create a strong new password.</p>

            <form className="forgot-form" onSubmit={resetPassword}>
              <input
                type="password"
                placeholder="New password"
                className="forgot-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirm new password"
                className="forgot-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="forgot-rules">
                Password must include uppercase, lowercase, number, special character
                and minimum 8 characters.
              </div>

              <button type="submit" className="forgot-primary-btn">
                Reset Password
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="forgot-title">Password Updated</h1>
            <p className="forgot-success">
              Your password has been reset successfully.
            </p>

            <Link to="/register" className="forgot-link-button">
              Go to Registration
            </Link>
          </>
        )}

        {message && <p className="forgot-error">{message}</p>}

        <Link to="/" className="forgot-back-link">
          Back to Login
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;