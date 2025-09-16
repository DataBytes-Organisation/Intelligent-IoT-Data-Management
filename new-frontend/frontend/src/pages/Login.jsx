import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await login(username.trim(), password);
    setSubmitting(false);
    if (res.ok) navigate(redirectTo, { replace: true });
    else setError(res.message || "Invalid credentials");
  };

  return (
    <div style={{ maxWidth: 420, margin: "24px 0" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "10px 16px" }}
        >
          {submitting ? "Signing in..." : "Login"}
        </button>

        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
          Demo creds → <b>admin</b> / <b>password</b>
        </div>
      </form>
    </div>
  );
}
