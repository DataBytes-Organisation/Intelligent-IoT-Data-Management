import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getAccessToken,
  refreshSession,
} from "../services/authClient";

const ProtectedRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(
    getAccessToken() ? "authenticated" : "checking"
  );

  useEffect(() => {
    if (getAccessToken()) {
      setAuthStatus("authenticated");
      return;
    }

    const restoreSession = async () => {
      try {
        await refreshSession();
        setAuthStatus("authenticated");
      } catch {
        setAuthStatus("unauthenticated");
      }
    };

    restoreSession();
  }, []);

  if (authStatus === "checking") {
    return null;
  }

  if (authStatus === "unauthenticated") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;