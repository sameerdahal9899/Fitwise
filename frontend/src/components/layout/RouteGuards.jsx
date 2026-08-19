import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { PageLoading } from "../ui/Primitives";

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageLoading />;
  if (status === "anonymous") return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RequireGuest() {
  const { status } = useAuth();
  if (status === "loading") return <PageLoading />;
  if (status === "authenticated") return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}

export function RequireCoach() {
  const { user, status } = useAuth();
  if (status === "loading") return <PageLoading />;
  if (!user?.is_coach) return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}
