// Just export types and utility functions that don't require JSX

export type Role = 'user' | 'editor' | 'admin';

// Function to check role permissions on the client side
export const hasPermission = (userRole: Role | undefined, requiredRoles: Role[]): boolean => {
  if (!userRole) return false;
  
  // Admin has all permissions
  if (userRole === 'admin') return true;
  
  // Check if user role is in required roles
  return requiredRoles.includes(userRole);
};
