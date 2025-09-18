import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
      <h2>Dashboard</h2>
      <p>
        Welcome, <strong>{user?.email}</strong> 🎉
      </p>

      <button
        onClick={logout}
        style={{ marginTop: 24, padding: "10px 16px", borderRadius: 8 }}
      >
        Logout
      </button>
    </div>
  );
}
