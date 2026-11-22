import { registerUser } from "../services/authClient";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegistrationPage.css";
import {
  validateFullName,
  validateEmail,
  validateSignupPassword,
  validateConfirmPassword,
  getPasswordRules,
} from "../utils/validation";

const RegistrationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const passwordRules = getPasswordRules(formData.password);

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case "fullName":
        return validateFullName(value);
      case "email":
        return validateEmail(value);
      case "password":
        return validateSignupPassword(value);
      case "confirmPassword":
        return validateConfirmPassword(allValues.password, value);
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name] || submitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, updated),
        ...(name === "password"
          ? { confirmPassword: validateConfirmPassword(value, updated.confirmPassword) }
          : {}),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const runFullValidation = () => {
    const newErrors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      password: validateSignupPassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
    };
    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);
  setFormError("");

  const isValid = runFullValidation();
  if (!isValid) {
    setFormError("Please fix the highlighted fields before continuing.");
    return;
  }

  try {
    await registerUser({
      email: formData.email.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    setFormError("");
    navigate("/");
  } catch (error) {
    const backendError = error.response?.data?.error;

    if (backendError?.fields) {
      setErrors((prev) => ({
        ...prev,
        ...backendError.fields,
      }));
    }

    setFormError(
      backendError?.message ||
        "Unable to create your account. Please try again."
    );
  }
};
  const fieldClass = (name) =>
    `auth-input${touched[name] && errors[name] ? " auth-input-invalid" : ""}`;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-badge">Intelligent IoT Platform</div>

        <h1 className="auth-title">Create Account</h1>

        <p className="auth-subtitle">
          Sign up to access the IoT sensor dashboard and analytics platform.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("fullName")}
              aria-invalid={Boolean(touched.fullName && errors.fullName)}
              aria-describedby="fullName-error"
            />
            {touched.fullName && errors.fullName && (
              <p className="field-error" id="fullName-error">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="auth-field">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("email")}
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby="email-error"
            />
            {touched.email && errors.email && (
              <p className="field-error" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-field">
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("password")}
                aria-invalid={Boolean(touched.password && errors.password)}
                aria-describedby="password-error password-rules"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {(touched.password || formData.password) && (
              <ul className="password-rules" id="password-rules">
                {passwordRules.map((rule) => (
                  <li key={rule.id} className={rule.valid ? "rule-valid" : "rule-invalid"}>
                    {rule.valid ? "✓" : "•"} {rule.label}
                  </li>
                ))}
              </ul>
            )}

            {touched.password && errors.password && (
              <p className="field-error" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="auth-field">
            <div className="auth-password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldClass("confirmPassword")}
                aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                aria-describedby="confirmPassword-error"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="field-error" id="confirmPassword-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {formError && <p className="auth-error">{formError}</p>}

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
          <button type="button" disabled title="Coming soon">
            Google
          </button>
          <button type="button" disabled title="Coming soon">
            Microsoft
          </button>
          <button type="button" disabled title="Coming soon">
            Apple
          </button>
        </div>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/" className="auth-footer-link">
            Login
          </Link>
        </p>

        <Link to="/forgot-password" className="auth-link">
          Forgot password?
        </Link>
      </section>
    </main>
  );
};

export default RegistrationPage;