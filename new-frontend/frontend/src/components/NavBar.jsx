// src/components/NavBar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function NavBar() {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <nav style={{ padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/">Dashboard</Link>
      <span style={{ margin: "0 12px" }}>|</span>
      {isAuthenticated ? (
        <>
          <span style={{ marginRight: 12 }}>
            {user?.name || user?.email}
          </span>
          <Link to="/logout">Logout</Link>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}
