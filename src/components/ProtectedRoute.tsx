import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { ApiLoading } from '@/components/ui/api-feedback';

interface ProtectedRouteProps {
  allowedRoles?: ('user' | 'editor' | 'admin')[];
}

/**
 * ProtectedRoute component to restrict access to authenticated users with specific roles
 * If no roles are specified, any authenticated user can access the route
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = ['user', 'editor', 'admin'] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ApiLoading message="Verifying authentication..." />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user doesn't have required role, redirect to unauthorized page
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
