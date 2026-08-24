// API utilities for making requests to the backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any; // Direct user property for backward compatibility
  message?: string;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    pages: number;
    total?: number; // For total count of items
    // Instagram-specific pagination properties
    cursors?: {
      before?: string;
      after?: string;
    };
    hasNextPage?: boolean;
  };
  resetToken?: string; // For password reset flow
  articlesCount?: number; // For category deletion checks
}

// Get token from local storage
const getToken = (): string | null => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.token || null;
    }
  } catch (error) {
    // Corrupt localStorage should not break the request path
    console.error('Failed to parse stored user data:', error);
  }
  return null;
};

// Create request headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function
export const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requireAuth: boolean = true
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: createHeaders(requireAuth),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Request failed',
      };
    }

    return result as ApiResponse<T>;
  } catch (error: any) {
    console.error('API Request Error:', error);
    return {
      success: false,
      message: error.message || 'Request failed',
    };
  }
};

// Auth endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) => 
    apiRequest<{ user: any }>('/auth/login', 'POST', credentials, false),
  
  register: (userData: { name: string; email: string; password: string }) => 
    apiRequest<{ user: any }>('/auth/register', 'POST', userData, false),
  
  getCurrentUser: () => 
    apiRequest<{ user: any }>('/auth/me'),
    
  forgotPassword: (email: string) => 
    apiRequest<{ resetToken: string }>('/auth/forgotpassword', 'POST', { email }, false),
  
  resetPassword: (resetToken: string, password: string) => 
    apiRequest<{ message: string }>(`/auth/resetpassword/${resetToken}`, 'PUT', { password }, false),
  
  // Test connection to server
  testConnection: () => 
    apiRequest<{ status: string }>('/health', 'GET', undefined, false),
};

// User endpoints
export const userApi = {
  getUsers: (params?: any) => 
    apiRequest<any[]>('/users', 'GET', params),
  
  getUser: (id: string) => 
    apiRequest<any>(`/users/${id}`),
  
  updateProfile: (userData: any) => 
    apiRequest<any>('/users/profile', 'PUT', userData),
  
  updateUser: (id: string, userData: any) => 
    apiRequest<any>(`/users/${id}`, 'PUT', userData),
  
  deleteUser: (id: string) => 
    apiRequest<null>(`/users/${id}`, 'DELETE'),
};

// News articles endpoints
export const newsApi = {
  getArticles: (params?: any) => {
    const queryString = params 
      ? `?${new URLSearchParams(params).toString()}` 
      : '';
    return apiRequest<any[]>(`/news${queryString}`, 'GET', undefined, false);
  },
  
  getArticle: (id: string) => 
    apiRequest<any>(`/news/${id}`, 'GET', undefined, false),
  
  createArticle: (articleData: any) => 
    apiRequest<any>('/news', 'POST', articleData),
  
  updateArticle: (id: string, articleData: any) => 
    apiRequest<any>(`/news/${id}`, 'PUT', articleData),
  
  deleteArticle: (id: string) => 
    apiRequest<null>(`/news/${id}`, 'DELETE'),
};

// Category endpoints
export const categoryApi = {
  getCategories: () => 
    apiRequest<any[]>('/categories', 'GET', undefined, false),
  
  getCategory: (id: string) => 
    apiRequest<any>(`/categories/${id}`, 'GET', undefined, false),
  
  createCategory: (categoryData: any) => 
    apiRequest<any>('/categories', 'POST', categoryData),
  
  updateCategory: (id: string, categoryData: any) => 
    apiRequest<any>(`/categories/${id}`, 'PUT', categoryData),
  
  deleteCategory: (id: string) => 
    apiRequest<null>(`/categories/${id}`, 'DELETE'),
};

// Comment endpoints
export const commentApi = {
  getCommentsByArticle: (articleId: string) => 
    apiRequest<any[]>(`/comments/article/${articleId}`, 'GET', undefined, false),
  
  getAllComments: (params?: any) => {
    const queryString = params 
      ? `?${new URLSearchParams(params).toString()}` 
      : '';
    return apiRequest<any[]>(`/comments${queryString}`);
  },
  
  createComment: (commentData: any) => 
    apiRequest<any>('/comments', 'POST', commentData),
  
  updateCommentStatus: (id: string, status: string) => 
    apiRequest<any>(`/comments/${id}`, 'PUT', { status }),
  
  deleteComment: (id: string) => 
    apiRequest<null>(`/comments/${id}`, 'DELETE'),
};
