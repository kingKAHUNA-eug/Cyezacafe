import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Use as a wrapper (<ProtectedRoute><Page /></ProtectedRoute>) or as a layout route.
// adminOnly: only users with the admin role get in.
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}