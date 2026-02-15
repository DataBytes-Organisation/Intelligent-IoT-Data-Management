import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user from localStorage on first load
  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  // DEMO: accept any non-empty email+password as "valid".
  // If you want a fixed demo account, replace with:
  // if (email === "demo@demo.com" && password === "Demo123!") { ... }
  function login(email, password) {
    if (!email || !password) throw new Error("Email and password are required.");
    const demoUser = { email };
    localStorage.setItem("auth_user", JSON.stringify(demoUser));
    setUser(demoUser);
    navigate("/dashboard", { replace: true });
  }

  function logout() {
    localStorage.removeItem("auth_user");
    setUser(null);
    navigate("/login", { replace: true });
  }

  const value = { user, isAuthed: !!user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
