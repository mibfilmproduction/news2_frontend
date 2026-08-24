import axios, { AxiosRequestConfig, AxiosHeaders, AxiosError, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Role types for authorization
export type UserRole = 'user' | 'editor' | 'admin';

// Auth related errors
export enum AuthErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN'
}

// Function to retrieve token from multiple possible sources
const getAuthToken = (): string | null => {
  const localStorage_token = localStorage.getItem('token');
  const sessionStorage_token = sessionStorage.getItem('token');
  const userObject = localStorage.getItem('user');
  
  if (localStorage_token) return localStorage_token;
  if (sessionStorage_token) return sessionStorage_token;
  
  // Try to parse user from localStorage if it exists
  if (userObject) {
    try {
      const parsedUser = JSON.parse(userObject);
      if (parsedUser?.token) {
        // Also save token to other storages for redundancy
        localStorage.setItem('token', parsedUser.token);
        sessionStorage.setItem('token', parsedUser.token);
        return parsedUser.token;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  
  return null;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token using our helper function
    const token = getAuthToken();
    
    if (token) {
      // Create headers if they don't exist
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      
      // Set Authorization header
      config.headers.set('Authorization', `Bearer ${token}`);
      
      // For multipart/form-data requests (file uploads), don't override Content-Type
      // as axios will set the correct boundary with proper boundary string
      if (config.data && config.data instanceof FormData) {
        config.headers.delete('Content-Type');
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Capture the original request for potential retries
    const originalRequest = error.config;
    
    if (error.response) {
      // Handle authentication errors (401)
      if (error.response.status === 401) {
        console.error('Authentication error:', error.response.data);
        // If unauthorized, provide more context in the error
        error.message = 'Authentication failed: ' + 
          ((error.response.data as any)?.message || 'Please log in again');
          
        // Clear auth tokens to prevent future failed requests
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Set error type for client handling
        (error as any).type = AuthErrorType.UNAUTHORIZED;
        
        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('auth:unauthorized', { detail: error });
        window.dispatchEvent(event);
      }
      
      // Handle permission errors (403)
      if (error.response.status === 403) {
        console.error('Permission denied:', error.response.data);
        // Set error type for client handling
        (error as any).type = AuthErrorType.FORBIDDEN;
        
        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('auth:forbidden', { detail: error });
        window.dispatchEvent(event);
      }
      
      // Handle token expiration - this would be based on your backend response
      if ((error.response.data as any)?.code === 'token_expired') {
        console.error('Token expired:', error.response.data);
        // Set error type for client handling
        (error as any).type = AuthErrorType.TOKEN_EXPIRED;
        
        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('auth:tokenExpired', { detail: error });
        window.dispatchEvent(event);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
