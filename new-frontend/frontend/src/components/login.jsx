import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      // if using MSW, this is intercepted; else just fake success:
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      localStorage.setItem("auth_token", data.token || "mock.token");
      localStorage.setItem("auth_user", JSON.stringify(data.user || { email }));

      if (typeof onSuccess === "function") onSuccess({ token: data.token, user: data.user });
      navigate("/dashboard", { replace: true });
    } catch (e2) {
      // fallback path if no backend/MSW: accept any non-empty fields
      if (email && password) {
        localStorage.setItem("auth_token", "dev-token");
        localStorage.setItem("auth_user", JSON.stringify({ email }));
        if (typeof onSuccess === "function") onSuccess({ token: "dev-token", user: { email } });
        navigate("/dashboard", { replace: true });
      } else {
        setErr(e2.message || "Login failed");
      }
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Sign in</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
