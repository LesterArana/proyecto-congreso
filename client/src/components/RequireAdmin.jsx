import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const k = localStorage.getItem("adminKey");
  return k ? children : <Navigate to="/admin-login" replace />;
}
