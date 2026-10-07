import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { user, ready } = useAuth();

  // Wait until we've checked localStorage for a saved session,
  // otherwise a logged-in user gets bounced to login on every refresh.
  if (!ready) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />;
  }

  if (requiredPermission && user.role !== 'admin'
      && !user.permissions?.includes(requiredPermission)) {
    const fallbackPath = user.permissions?.includes('visitors.view')
      ? '/visitors'
      : user.permissions?.includes('visitors.register')
        ? '/register'
        : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
