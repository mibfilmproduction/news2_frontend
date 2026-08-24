import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import api from '../services/api';

// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'editor' | 'admin';
  avatar?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'editor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
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
  login: async () => ({ success: false, message: 'Not initialized' }),
  logout: () => {},
  register: async () => ({ success: false, message: 'Not initialized' }),
  updateProfile: async () => false,
  checkAuthStatus: async () => false
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
          const response = await api.get('/auth/verify');
          if (response.data && response.data.success) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // If token verification fails, clear stored data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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

      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.success) {
        const { user, token } = response.data;
        storeAuthData(user, token);
        return { success: true };
      } else {
        const errorMessage = response.data?.message || 'Login failed';
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

      // Default to 'user' role if none specified or if trying to register as admin without authorization
      const registrationData = {
        ...userData,
        role: userData.role || 'user'
      };

      // Admin role requires special authorization - additional checks would happen on the backend
      if (registrationData.role === 'admin') {
        // The backend should validate if this user is allowed to be an admin
        console.log('Attempting to register with admin role - backend will verify');
      }

      const response = await api.post('/auth/register', registrationData);
      
      if (response.data && response.data.success) {
        const { user, token } = response.data;
        storeAuthData(user, token);
        return { success: true };
      } else {
        const errorMsg = response.data?.message || 'Registration failed';
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

      const response = await api.put('/users/profile', data);
      
      if (response.data && response.data.success) {
        // Update user data in state and localStorage
        const updatedUser = { ...user, ...response.data.user } as User;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } else {
        setError(response.data?.message || 'Profile update failed');
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
      const response = await api.get('/auth/verify');
      
      if (response.data && response.data.success) {
        // If the server returns updated user data, use it
        if (response.data.user) {
          const updatedUser = response.data.user;
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
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
    login,
    logout,
    register,
    updateProfile,
    checkAuthStatus
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
