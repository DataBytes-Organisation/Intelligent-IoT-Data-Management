import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthed = !!localStorage.getItem("auth_token");
  return isAuthed ? children : <Navigate to="/login" replace />;
}
