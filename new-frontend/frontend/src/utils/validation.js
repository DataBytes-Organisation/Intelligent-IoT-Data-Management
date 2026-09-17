const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const email = (value || "").trim();
  if (!email) return "Email address is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address (e.g. name@example.com).";
  return "";
}

export function getPasswordRules(password) {
  const value = password || "";
  return [
    { id: "length", label: "12-128 characters", valid: value.length >= 12 && value.length <= 128 },
    { id: "upper", label: "One uppercase letter", valid: /[A-Z]/.test(value) },
    { id: "lower", label: "One lowercase letter", valid: /[a-z]/.test(value) },
    { id: "number", label: "One number", valid: /\d/.test(value) },
    { id: "special", label: "One special character (!@#$%^&*)", valid: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(value) },
  ];
}

export function validateSignupPassword(password) {
  if (!password) return "Password is required.";
  const rules = getPasswordRules(password);
  const failed = rules.find((rule) => !rule.valid);
  return failed ? "Password does not meet all the requirements below." : "";
}

export function validateLoginPassword(password) {
  if (!password) return "Password is required.";
  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
}

export function validateFullName(name) {
  const value = (name || "").trim();
  if (!value) return "Full name is required.";
  if (value.length < 2) return "Full name must be at least 2 characters.";
  return "";
}