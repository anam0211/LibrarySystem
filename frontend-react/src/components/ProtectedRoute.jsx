import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDefaultRoute } from "../api/authStore";

export default function ProtectedRoute({ session, roles, children }) {
  const location = useLocation();

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(session.role)) {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }

  return children || <Outlet />;
}
