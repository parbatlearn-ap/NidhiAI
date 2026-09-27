import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../lib/auth-store";

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const profile = useAuthStore((s) => s.profile);
  if (profile && profile.role !== "admin") {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
