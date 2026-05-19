import React, { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

// Demo user (replace with API below if you have a backend)
const DEMO = { username: "admin", password: "password", profile: { name: "Admin" } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // store profile object

  // Load session on boot
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
  }, []);

  // --- Login implementations ---

  // 1) DEMO (no backend)
  const login = async (username, password) => {
    if (username === DEMO.username && password === DEMO.password) {
      localStorage.setItem("user", JSON.stringify(DEMO.profile));
      setUser(DEMO.profile);
      return { ok: true };
    }
    return { ok: false, message: "Invalid credentials" };
  };

  // 2) REAL BACKEND (uncomment & adjust)
  // const login = async (username, password) => {
  //   try {
  //     const res = await fetch("http://localhost:8000/api/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include", // if using cookies
  //       body: JSON.stringify({ username, password }),
  //     });
  //     if (!res.ok) throw new Error("Login failed");
  //     const data = await res.json(); // { token, user }
  //     // If your API returns a token, store it if you want:
  //     // localStorage.setItem("token", data.token);
  //     localStorage.setItem("user", JSON.stringify(data.user));
  //     setUser(data.user);
  //     return { ok: true };
  //   } catch (e) {
  //     return { ok: false, message: "Login failed" };
  //   }
  // };

  const logout = async () => {
    // If you have an API endpoint for logout, call it here (optional)
    // try { await fetch("http://localhost:8000/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
