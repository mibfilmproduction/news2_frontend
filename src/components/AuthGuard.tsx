import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '../utils/authGuard';

// Component to protect routes based on authentication status and optional role
const AuthGuard: React.FC<{ 
  children: React.ReactNode; 
  requiredRoles?: Role[];
}> = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If no specific roles required or user is admin (who has all permissions)
  if (requiredRoles.length === 0 || user?.role === 'admin') {
    return <>{children}</>;
  }
  
  // Check if user has one of the required roles
  if (user && requiredRoles.includes(user.role)) {
    return <>{children}</>;
  }
  
  // User is authenticated but lacks necessary role
  return <Navigate to="/unauthorized" replace />;
};

// Hook to check if current user has required role(s)
export const useAuthorization = (requiredRoles: Role[] = []) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return false;
  }
  
  // Admin has access to everything
  if (user.role === 'admin') {
    return true;
  }
  
  // Check if user's role is included in required roles
  return requiredRoles.includes(user.role);
};

export default AuthGuard;
