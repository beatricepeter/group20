import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  enforcePermissionForAdmin = false,
}) {
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

  const requiredPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission ? [requiredPermission] : [];

  if (requiredPermissions.length > 0 && (user.role !== 'admin' || enforcePermissionForAdmin)) {
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      user.permissions?.includes(permission)
    );

    if (!hasRequiredPermission) {
      const fallbackPath = user.role === 'admin'
        ? '/admin-dashboard'
        : user.permissions?.includes('visitors.view')
          ? '/visitors'
          : user.permissions?.includes('visitors.register')
            ? '/register'
            : '/';
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
}
