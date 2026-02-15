import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";  // ✅ fixed path

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      login(email.trim(), password.trim());
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16 }}>Login</h2>
      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          style={{ width: "100%", padding: 8, margin: "6px 0 14px 0" }}
        />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="••••••••"
          style={{ width: "100%", padding: 8, margin: "6px 0 18px 0" }}
        />
        <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 8 }}>
          Sign in
        </button>
      </form>
      <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
        Demo: any email + any password works.
      </p>
    </div>
  );
}
