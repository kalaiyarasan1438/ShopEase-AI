import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectUserRole,
  selectAuthInitialized,
} from '@store/slices/authSlice';

/**
 * ProtectedRoute — wraps routes that require authentication or specific roles.
 *
 * Usage (as layout wrapper — outlet mode):
 *   <Route element={<ProtectedRoute roles={['ADMIN']} />}>
 *     <Route path="/admin" element={<AdminLayout />} />
 *   </Route>
 *
 * Usage (as children wrapper):
 *   <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const authInitialized = useSelector(selectAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole        = useSelector(selectUserRole);
  const location        = useLocation();

  // Wait until the startup fetchCurrentUser attempt has settled.
  // Rendering a blank screen (null) prevents premature redirects
  // while the token is being validated against the server.
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = useSelector((state) => state.auth.user);
  const userRoles = user?.roles || [];
  const userRoleArray = Array.isArray(userRoles) ? userRoles : Array.from(userRoles);

  if (roles.length > 0) {
    const hasRole = roles.some(r => userRoleArray.includes(r) || userRole === r);
    if (!hasRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return children || <Outlet />;
}
