import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authApi } from '@/lib/api-client';

// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'editor' | 'admin';
  avatar?: string;
  bio?: string;
  token?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isEditor: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  checkAuthStatus: () => Promise<boolean>;
}

// Create default context
const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isAdmin: false,
  isEditor: false,
  isStaff: false,
  login: async () => ({ success: false, message: 'Not initialized' }),
  logout: () => {},
  register: async () => ({ success: false, message: 'Not initialized' }),
  updateProfile: async () => false,
  checkAuthStatus: async () => false,
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store auth data in local storage
  const storeAuthData = useCallback((userData: User, userToken: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Verify token validity with the server
          const response = await authApi.verifyToken();
          if (response.success && response.data) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // If token verification fails, clear stored data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('useAuth.login: Calling authApi.login with', { email, passwordLength: password.length });

      const response = await authApi.login({ email, password });

      console.log('useAuth.login: Response from authApi.login:', { success: response.success, hasData: !!response.data, dataKeys: response.data ? Object.keys(response.data) : null, message: response.message });

      if (response.success && response.data) {
        // Backend returns user with token inside it
        const userData = response.data.user;
        const token = userData.token;
        console.log('useAuth.login: Extracted userData:', { hasUser: !!userData, hasToken: !!token });
        storeAuthData(userData, token);
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  // Register function
  const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate password match
      if (userData.password !== userData.confirmPassword) {
        setError('Passwords do not match');
        return { success: false, message: 'Passwords do not match' };
      }

      // Password strength validation
      if (userData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return { success: false, message: 'Password must be at least 8 characters long' };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        setError('Please enter a valid email address');
        return { success: false, message: 'Please enter a valid email address' };
      }

      // Send only name, email, password to backend (role is forced to 'user' by backend)
      const registrationData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      };

      const response = await authApi.register(registrationData);

      if (response.success && response.data) {
        const userData = response.data.user;
        const token = userData.token;
        storeAuthData(userData, token);
        return { success: true };
      } else {
        const errorMsg = response.message || 'Registration failed';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.updateProfile?.(data) ?? await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then(r => r.json());

      if (response.success) {
        // Update user data in state and localStorage
        const updatedUser = { ...user, ...response.data.user } as User;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } else {
        setError(response.message || 'Profile update failed');
        return false;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile update failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status function
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        logout();
        return false;
      }

      // Verify token validity with the server
      const response = await authApi.verifyToken();

      if (response.success) {
        // If the server returns updated user data, use it
        if (response.data && response.data.user) {
          const updatedUser = response.data.user;
          localStorage.setItem('user', JSON.stringify(updatedUser));
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else if (response.data) {
          // Fallback for backward compatibility
          localStorage.setItem('user', JSON.stringify(response.data));
          sessionStorage.setItem('user', JSON.stringify(response.data));
          setUser(response.data);
        } else {
          // Otherwise use the stored user data
          setUser(JSON.parse(storedUser));
        }
        setToken(storedToken);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (err) {
      console.error('Auth check error:', err);
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor',
    isStaff: user?.role === 'admin' || user?.role === 'editor',
    login,
    logout,
    register,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

// Export for components that import the default
export default useAuth;
