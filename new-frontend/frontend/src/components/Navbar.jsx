import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { isAuthed } = useAuth();
  return (
    <nav style={{ display: "flex", gap: 16, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      {!isAuthed ? (
        <Link to="/login" style={{ marginLeft: "auto" }}>Login</Link>
      ) : (
        <Link to="/logout" style={{ marginLeft: "auto" }}>Logout</Link>
      )}
    </nav>
  );
}
