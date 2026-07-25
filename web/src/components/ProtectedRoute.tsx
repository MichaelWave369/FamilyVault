import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';

export default function ProtectedRoute() {
  const {user, loading} = useAuth();
  const location = useLocation();
  if (loading) return <div className="centered">Opening your family space…</div>;
  if (!user) return <Navigate to="/login" replace state={{from: location.pathname}} />;
  return <Outlet />;
}
