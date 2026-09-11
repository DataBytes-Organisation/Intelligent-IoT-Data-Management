import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { validateEmail, validateLoginPassword } from "../utils/validation";
import {
  loginUser,
  verifyTwoFactorCode,
  resendTwoFactorCode,
  setAccessToken,
} from "../services/authClient";

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [mfaChallengeId, setMfaChallengeId] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef([]);

  const handleFieldChange = (name, value) => {
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]:
          name === "email"
            ? validateEmail(value)
            : validateLoginPassword(value),
      }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]:
        name === "email"
          ? validateEmail(value)
          : validateLoginPassword(value),
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validateLoginPassword(password);

    setFieldErrors({
      email: emailError,
      password: passwordError,
    });

    setTouched({
      email: true,
      password: true,
    });

    if (emailError || passwordError) {
      setMessage("Please fix the highlighted fields before continuing.");
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await loginUser({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (response.status === 202) {
        const challengeId = response.data?.mfaChallengeId;

        if (!challengeId) {
          throw new Error("MFA challenge was not returned by the server.");
        }

        setMfaChallengeId(challengeId);
        setOtp(["", "", "", "", "", ""]);
        setStep(2);
        return;
      }

      const accessToken = response.data?.accessToken;

      if (!accessToken) {
        throw new Error("Access token was not returned by the server.");
      }

      setAccessToken(accessToken);

      setMessage("");
      navigate("/home");
    } catch (error) {
      const backendError = error.response?.data?.error;

      if (backendError?.fields) {
        setFieldErrors((prev) => ({
          ...prev,
          ...backendError.fields,
        }));
      }

      setMessage(
        backendError?.message ||
          error.message ||
          "Unable to sign in. Please try again."
      );

      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
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

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    const enteredCode = otp.join("");

    if (enteredCode.length !== 6) {
      setMessage("Please enter the 6-digit verification code.");
      setMessageType("error");
      return;
    }

    if (!mfaChallengeId) {
      setMessage("Your verification session is no longer available. Please log in again.");
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await verifyTwoFactorCode({
        mfaChallengeId,
        otp: enteredCode,
        rememberMe,
      });

      const accessToken = response.data?.accessToken;

      if (!accessToken) {
        throw new Error("Access token was not returned by the server.");
      }

      setAccessToken(accessToken);

      setMessage("");
      navigate("/home");
    } catch (error) {
      const backendError = error.response?.data?.error;

      setMessage(
        backendError?.message ||
          error.message ||
          "Unable to verify the code. Please try again."
      );

      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!mfaChallengeId) {
      setMessage("Please return to login and try again.");
      setMessageType("error");
      return;
    }

    try {
      setMessage("");

      const response = await resendTwoFactorCode({
        mfaChallengeId,
      });

      const newChallengeId = response.data?.mfaChallengeId;

      if (newChallengeId) {
        setMfaChallengeId(newChallengeId);
      }

      setOtp(["", "", "", "", "", ""]);
      setMessage("A new verification code has been sent.");
      setMessageType("success");
    } catch (error) {
      const backendError = error.response?.data?.error;

      setMessage(
        backendError?.message ||
          "Unable to resend the verification code."
      );

      setMessageType("error");
    }
  };

  const handleBackToLogin = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setMfaChallengeId(null);
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
                  messageType === "success"
                    ? "success-alert"
                    : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form
              className="login-form"
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) =>
                    handleFieldChange("email", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlur("email", e.target.value)
                  }
                  className={
                    touched.email && fieldErrors.email
                      ? "input-error"
                      : ""
                  }
                />

                {touched.email && fieldErrors.email && (
                  <p className="field-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>

                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlur("password", e.target.value)
                    }
                    className={
                      touched.password && fieldErrors.password
                        ? "input-error"
                        : ""
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {touched.password && fieldErrors.password && (
                  <p className="field-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />
                  Remember me
                </label>

                <Link
                  to="/forgot-password"
                  className="forgot-link"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="signup-text">
              Don&apos;t have an account?{" "}
              <Link to="/register">Sign up</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Two-Factor Authentication</h1>

            <p className="login-subtitle">
              Enter the 6-digit verification code sent to your
              email address.
            </p>

            {message && (
              <p
                className={`form-alert ${
                  messageType === "success"
                    ? "success-alert"
                    : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form
              className="login-form"
              onSubmit={handleVerifyCode}
            >
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    ref={(el) =>
                      (inputRefs.current[index] = el)
                    }
                  />
                ))}
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Verifying..."
                  : "Verify Code"}
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