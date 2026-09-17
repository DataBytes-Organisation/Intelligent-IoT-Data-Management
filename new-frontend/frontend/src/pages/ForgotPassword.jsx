import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(
    searchParams.get("token") || ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendResetLink = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await fetch(
        "/api/auth/password-reset/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error?.message ||
            "Unable to send reset link."
        );
        return;
      }

      setMessage("");
      setStep(2);
    } catch (error) {
      setMessage(
        "Backend connection failed. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueToReset = () => {
    if (!resetToken.trim()) {
      setMessage(
        "Please enter the reset token from your email."
      );
      return;
    }

    setMessage("");
    setStep(3);
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }

    if (!passwordPattern.test(newPassword)) {
      setMessage(
        "Password must be 12-128 characters and include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(
        "New password and confirm password must match."
      );
      return;
    }

    if (!resetToken.trim()) {
      setMessage(
        "Reset token is missing. Please use the token from your reset email."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await fetch(
        "/api/auth/password-reset/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken.trim(),
            password: newPassword,
            confirmPassword,
          }),
        }
      );

      if (!response.ok) {
        let data = {};

        try {
          data = await response.json();
        } catch {
          // 204 responses have no JSON body
        }

        setMessage(
          data.error?.message ||
            "Unable to reset password."
        );
        return;
      }

      setMessage("");
      setStep(4);
    } catch (error) {
      setMessage(
        "Backend connection failed. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-icon">🔐</div>

        {step === 1 && (
          <>
            <h1 className="forgot-title">
              Forgot Password?
            </h1>

            <p className="forgot-text">
              Enter your email address and we will send you a
              password reset link.
            </p>

            <form
              className="forgot-form"
              onSubmit={sendResetLink}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="forgot-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="submit"
                className="forgot-primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="forgot-title">
              Check Your Email
            </h1>

            <p className="forgot-text">
              If an account exists for that email, reset
              instructions have been sent.
            </p>

            <form
              className="forgot-form"
              onSubmit={(e) => {
                e.preventDefault();
                continueToReset();
              }}
            >
              <input
                type="text"
                placeholder="Enter reset token"
                className="forgot-input"
                value={resetToken}
                onChange={(e) =>
                  setResetToken(e.target.value)
                }
              />

              <button
                type="submit"
                className="forgot-primary-btn"
              >
                Continue to Reset Password
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="forgot-title">
              Reset Password
            </h1>

            <p className="forgot-text">
              Create a strong new password.
            </p>

            <form
              className="forgot-form"
              onSubmit={resetPassword}
            >
              <input
                type="password"
                placeholder="New password"
                className="forgot-input"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Confirm new password"
                className="forgot-input"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />

              <div className="forgot-rules">
                Password must include uppercase, lowercase,
                number, special character and 12-128
                characters.
              </div>

              <button
                type="submit"
                className="forgot-primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="forgot-title">
              Password Updated
            </h1>

            <p className="forgot-success">
              Your password has been reset successfully.
            </p>

            <Link
              to="/"
              className="forgot-link-button"
            >
              Go to Login
            </Link>
          </>
        )}

        {message && (
          <p className="forgot-error">{message}</p>
        )}

        <Link to="/" className="forgot-back-link">
          Back to Login
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;