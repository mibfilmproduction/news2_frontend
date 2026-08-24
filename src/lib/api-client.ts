import { ApiResponse } from './api';

// Use the same base URL as in api.ts or use environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API client for making standardized requests to the backend
 */
export const api = {
  /**
   * Make a GET request to the API
   * @param endpoint - API endpoint path (without the base URL)
   * @param params - Optional query parameters
   */
  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
      
      // Add query parameters if provided
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      // Get token with enhanced validation
      const token = getAuthToken();
      // Retry mechanism for token refresh if needed
      let retryCount = 0;
      const maxRetries = 1;
      
      async function executeRequest() {
        const currentToken = getAuthToken();
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
          }
        });
        
        // Handle 401 errors with token refresh attempt
        if (response.status === 401 && retryCount < maxRetries) {
          console.warn('Received 401 error, attempting to refresh token...');
          retryCount++;
          
          // Try to get a fresh token by redirecting to login (if in browser context)
          if (typeof window !== 'undefined') {
            // Clear potentially expired tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // If this is a protected endpoint, redirect to login
            if (endpoint.includes('/admin') || 
                endpoint.includes('/user') || 
                endpoint.includes('/protected')) {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
              throw new Error('Authentication required. Redirecting to login page.');
            }
          }
          
          // Try one more time with fresh token if available
          const freshToken = getAuthToken();
          if (freshToken && freshToken !== currentToken) {
            return executeRequest(); // Retry with fresh token
          }
        }
        
        return response;
      }
      
      const response = await executeRequest();
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in data)) {
        data.success = response.ok;
      }
      
      return data;
    } catch (error) {
      console.error(`API GET error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },
  
  /**
   * Make a POST request to the API
   * @param endpoint - API endpoint path (without the base URL)
   * @param data - Request body
   */
  async post<T = any>(endpoint: string, requestData: any): Promise<ApiResponse<T>> {
    try {
      // Get token with enhanced validation
      const token = getAuthToken();
      // Retry mechanism for token refresh if needed
      let retryCount = 0;
      const maxRetries = 1;
      
      async function executeRequest() {
        const currentToken = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
          },
          body: JSON.stringify(requestData)
        });
        
        // Handle 401 errors with token refresh attempt
        if (response.status === 401 && retryCount < maxRetries) {
          console.warn('Received 401 error in POST, attempting to refresh token...');
          retryCount++;
          
          // Try to get a fresh token by checking storage again
          if (typeof window !== 'undefined') {
            // Clear potentially expired tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // If this is a protected endpoint, redirect to login
            if (endpoint.includes('/admin') || 
                endpoint.includes('/user') || 
                endpoint.includes('/protected')) {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
              throw new Error('Authentication required. Redirecting to login page.');
            }
          }
          
          // Try one more time with fresh token if available
          const freshToken = getAuthToken();
          if (freshToken && freshToken !== currentToken) {
            return executeRequest(); // Retry with fresh token
          }
        }
        
        return response;
      }
      
      const response = await executeRequest();
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in responseData)) {
        responseData.success = response.ok;
      }
      
      return responseData;
    } catch (error) {
      console.error(`API POST error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },
  
  /**
   * Make a PUT request to the API
   * @param endpoint - API endpoint path (without the base URL)
   * @param body - Request body
   */
  async put<T = any>(endpoint: string, requestData: any): Promise<ApiResponse<T>> {
    try {
      // Get token with enhanced validation
      const token = getAuthToken();
      // Retry mechanism for token refresh if needed
      let retryCount = 0;
      const maxRetries = 1;
      
      async function executeRequest() {
        const currentToken = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
          },
          body: JSON.stringify(requestData)
        });
        
        // Handle 401 errors with token refresh attempt
        if (response.status === 401 && retryCount < maxRetries) {
          console.warn('Received 401 error in PUT, attempting to refresh token...');
          retryCount++;
          
          // Try to get a fresh token by checking storage again
          if (typeof window !== 'undefined') {
            // Clear potentially expired tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // If this is a protected endpoint, redirect to login
            if (endpoint.includes('/admin') || 
                endpoint.includes('/user') || 
                endpoint.includes('/protected')) {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
              throw new Error('Authentication required. Redirecting to login page.');
            }
          }
          
          // Try one more time with fresh token if available
          const freshToken = getAuthToken();
          if (freshToken && freshToken !== currentToken) {
            return executeRequest(); // Retry with fresh token
          }
        }
        
        return response;
      }
      
      const response = await executeRequest();
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in responseData)) {
        responseData.success = response.ok;
      }
      
      return responseData;
    } catch (error) {
      console.error(`API PUT error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },
  
  /**
   * Make a DELETE request to the API
   * @param endpoint - API endpoint path (without the base URL)
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // Get token with enhanced validation
      const token = getAuthToken();
      // Retry mechanism for token refresh if needed
      let retryCount = 0;
      const maxRetries = 1;
      
      async function executeRequest() {
        const currentToken = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
          }
        });
        
        // Handle 401 errors with token refresh attempt
        if (response.status === 401 && retryCount < maxRetries) {
          console.warn('Received 401 error in DELETE, attempting to refresh token...');
          retryCount++;
          
          // Try to get a fresh token by checking storage again
          if (typeof window !== 'undefined') {
            // Clear potentially expired tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // If this is a protected endpoint, redirect to login
            if (endpoint.includes('/admin') || 
                endpoint.includes('/user') || 
                endpoint.includes('/protected')) {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
              throw new Error('Authentication required. Redirecting to login page.');
            }
          }
          
          // Try one more time with fresh token if available
          const freshToken = getAuthToken();
          if (freshToken && freshToken !== currentToken) {
            return executeRequest(); // Retry with fresh token
          }
        }
        
        return response;
      }
      
      const response = await executeRequest();
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in data)) {
        data.success = response.ok;
      }
      
      return data;
    } catch (error) {
      console.error(`API DELETE error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },
  
  /**
   * Upload a file with FormData
   * @param endpoint - API endpoint path (without the base URL)
   * @param formData - FormData object with file and other form fields
   */
  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          // Don't set Content-Type header, browser will set it with boundary for FormData
        },
        body: formData
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in data)) {
        data.success = response.ok;
      }
      
      return data;
    } catch (error) {
      console.error(`API upload error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },
  
  /**
   * Update with file upload using FormData
   * @param endpoint - API endpoint path (without the base URL)
   * @param formData - FormData object with file and other form fields
   */
  async updateWithUpload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          // Don't set Content-Type header, browser will set it with boundary for FormData
        },
        body: formData
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        return { 
          success: false, 
          message: 'Invalid JSON response from server'
        };
      }
      
      // Ensure response has the expected structure
      if (!('success' in data)) {
        data.success = response.ok;
      }
      
      return data;
    } catch (error) {
      console.error(`API update with upload error for ${endpoint}:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
};

/**
 * Get auth token from localStorage or sessionStorage
 * Enhanced to check both storage locations for better reliability
 */
function getAuthToken(): string | null {
  try {
    // First try localStorage
    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        if (parsedUser && parsedUser.token) {
          return parsedUser.token;
        }
      } catch (e) {
        console.warn('Invalid user data in localStorage');
      }
    }
    
    // Then try sessionStorage
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        if (parsedUser && parsedUser.token) {
          return parsedUser.token;
        }
      } catch (e) {
        console.warn('Invalid user data in sessionStorage');
      }
    }
    
    // Try direct token storage if user object approach failed
    const directToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (directToken) {
      return directToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
