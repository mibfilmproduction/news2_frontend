import type { ApiResponse } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
  timeout?: number;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

function getAuthToken(): string | null {
  try {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        if (parsedUser && parsedUser.token) {
          return parsedUser.token;
        }
      } catch {
        console.warn('Invalid user data in localStorage');
      }
    }

    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        if (parsedUser && parsedUser.token) {
          return parsedUser.token;
        }
      } catch {
        console.warn('Invalid user data in sessionStorage');
      }
    }

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

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    return {
      success: false,
      message: 'Invalid JSON response from server',
    };
  }

  if (!('success' in data)) {
    data.success = response.ok;
  }

  if (!response.ok) {
    return {
      success: false,
      message: data.message || `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  return data as ApiResponse<T>;
}

function createHeaders(requireAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

export const api = {
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, requireAuth = true, timeout = 30000, ...fetchOptions } = options;
    const url = buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...createHeaders(requireAuth),
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, message: 'Request timeout' };
      }
      console.error(`API error for ${endpoint}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  get<T = any>(endpoint: string, params?: Record<string, string | number | boolean | undefined>, options?: Omit<RequestOptions, 'params' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  },

  post<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'params' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    });
  },

  put<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'params' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    });
  },

  patch<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'params' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    });
  },

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'params' | 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  upload<T = any>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'params' | 'method' | 'body' | 'headers'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

export const authApi = {
  login: (credentials: { email: string; password: string }) => api.post<{ user: any; token: string }>('/auth/login', credentials, { requireAuth: false }),
  register: (userData: { name: string; email: string; password: string; role?: string }) => api.post<{ user: any; token: string }>('/auth/register', userData, { requireAuth: false }),
  getCurrentUser: () => api.get<{ user: any }>('/auth/me'),
  forgotPassword: (email: string) => api.post<{ resetToken: string }>('/auth/forgotpassword', { email }, { requireAuth: false }),
  resetPassword: (resetToken: string, password: string) => api.put<{ message: string }>(`/auth/resetpassword/${resetToken}`, { password }, { requireAuth: false }),
  verifyToken: () => api.get<{ user: any }>('/auth/verify'),
  testConnection: () => api.get<{ status: string }>('/health', {}, { requireAuth: false }),
  updateProfile: (userData: any) => api.put<{ user: any }>('/users/profile', userData),
};

export const userApi = {
  getUsers: (params?: any) => api.get<any[]>('/users', params),
  getUser: (id: string) => api.get<any>(`/users/${id}`),
  updateProfile: (userData: any) => api.put<any>('/users/profile', userData),
  updateUser: (id: string, userData: any) => api.put<any>(`/users/${id}`, userData),
  deleteUser: (id: string) => api.delete<null>(`/users/${id}`),
};

export const newsApi = {
  getArticles: (params?: any) => api.get<any[]>('/news', params, { requireAuth: false }),
  getArticle: (id: string) => api.get<any>(`/news/${id}`, {}, { requireAuth: false }),
  getArticleBySlug: (slug: string) => api.get<any>(`/news/slug/${slug}`, {}, { requireAuth: false }),
  createArticle: (articleData: any) => api.post<any>('/news', articleData),
  updateArticle: (id: string, articleData: any) => api.put<any>(`/news/${id}`, articleData),
  deleteArticle: (id: string) => api.delete<null>(`/news/${id}`),
  getBreakingArticles: (params?: any) => api.get<any[]>('/news/breaking', params, { requireAuth: false }),
  getTrendingArticles: (params?: any) => api.get<any[]>('/news/trending', params, { requireAuth: false }),
  getPopularArticles: (params?: any) => api.get<any[]>('/news/popular', params, { requireAuth: false }),
  getArticleStats: (id: string) => api.get<any>(`/news/${id}/stats`),
  incrementViewCount: (id: string) => api.post<any>(`/news/${id}/views`, {}),
  searchArticles: (params?: any) => api.get<any[]>('/news/search', params, { requireAuth: false }),
  getPopularTags: (params?: any) => api.get<string[]>('/news/tags/popular', params, { requireAuth: false }),
};

export const categoryApi = {
  getCategories: (params?: any) => api.get<any[]>('/categories', params, { requireAuth: false }),
  getCategory: (id: string) => api.get<any>(`/categories/${id}`, {}, { requireAuth: false }),
  getCategoryBySlug: (slug: string) => api.get<any>(`/categories/slug/${slug}`, {}, { requireAuth: false }),
  createCategory: (categoryData: any) => api.post<any>('/categories', categoryData),
  updateCategory: (id: string, categoryData: any) => api.put<any>(`/categories/${id}`, categoryData),
  deleteCategory: (id: string) => api.delete<null>(`/categories/${id}`),
};

export const commentApi = {
  getCommentsByArticle: (articleId: string) => api.get<any[]>(`/comments/article/${articleId}`, {}, { requireAuth: false }),
  getAllComments: (params?: any) => api.get<any[]>('/comments', params),
  createComment: (commentData: any) => api.post<any>('/comments', commentData),
  updateCommentStatus: (id: string, status: string) => api.put<any>(`/comments/${id}`, { status }),
  deleteComment: (id: string) => api.delete<null>(`/comments/${id}`),
};

export const videoApi = {
  getVideos: (params?: any) => api.get<any[]>('/videos', params, { requireAuth: false }),
  getVideo: (id: string) => api.get<any>(`/videos/${id}`, {}, { requireAuth: false }),
  createVideo: (videoData: any) => api.post<any>('/videos', videoData),
  updateVideo: (id: string, videoData: any) => api.put<any>(`/videos/${id}`, videoData),
  deleteVideo: (id: string) => api.delete<null>(`/videos/${id}`),
};

export const liveTvApi = {
  getChannels: (params?: any) => api.get<any[]>('/live-tv', params, { requireAuth: false }),
  getChannel: (id: string) => api.get<any>(`/live-tv/${id}`, {}, { requireAuth: false }),
  createChannel: (channelData: FormData) => api.upload<any>('/live-tv', channelData),
  updateChannel: (id: string, channelData: FormData) => api.upload<any>(`/live-tv/${id}`, channelData),
  deleteChannel: (id: string) => api.delete<null>(`/live-tv/${id}`),
  toggleFeatured: (id: string) => api.put<any>(`/live-tv/${id}/toggle-featured`, {}),
  getCategories: () => api.get<string[]>('/live-tv/categories', {}, { requireAuth: false }),
};

export const sportsApi = {
  getSports: (params?: any) => api.get<any[]>('/sports', params, { requireAuth: false }),
  getSport: (id: string) => api.get<any>(`/sports/${id}`, {}, { requireAuth: false }),
  createSport: (sportData: any) => api.post<any>('/sports', sportData),
  updateSport: (id: string, sportData: any) => api.put<any>(`/sports/${id}`, sportData),
  deleteSport: (id: string) => api.delete<null>(`/sports/${id}`),
  getLeagues: (params?: any) => api.get<any[]>('/leagues', params, { requireAuth: false }),
  getLeague: (id: string) => api.get<any>(`/leagues/${id}`, {}, { requireAuth: false }),
  createLeague: (leagueData: any) => api.post<any>('/leagues', leagueData),
  updateLeague: (id: string, leagueData: any) => api.put<any>(`/leagues/${id}`, leagueData),
  deleteLeague: (id: string) => api.delete<null>(`/leagues/${id}`),
  getTeams: (params?: any) => api.get<any[]>('/teams', params, { requireAuth: false }),
  getTeam: (id: string) => api.get<any>(`/teams/${id}`, {}, { requireAuth: false }),
  createTeam: (teamData: any) => api.post<any>('/teams', teamData),
  updateTeam: (id: string, teamData: any) => api.put<any>(`/teams/${id}`, teamData),
  deleteTeam: (id: string) => api.delete<null>(`/teams/${id}`),
  getMatches: (params?: any) => api.get<any[]>('/matches', params, { requireAuth: false }),
  getMatch: (id: string) => api.get<any>(`/matches/${id}`, {}, { requireAuth: false }),
  createMatch: (matchData: any) => api.post<any>('/matches', matchData),
  updateMatch: (id: string, matchData: any) => api.put<any>(`/matches/${id}`, matchData),
  deleteMatch: (id: string) => api.delete<null>(`/matches/${id}`),
};

export const advertisementApi = {
  getAdvertisements: (params?: any) => api.get<any[]>('/advertisements', params, { requireAuth: false }),
  getAdvertisement: (id: string) => api.get<any>(`/advertisements/${id}`, {}, { requireAuth: false }),
  createAdvertisement: (adData: any) => api.post<any>('/advertisements', adData),
  updateAdvertisement: (id: string, adData: any) => api.put<any>(`/advertisements/${id}`, adData),
  deleteAdvertisement: (id: string) => api.delete<null>(`/advertisements/${id}`),
  uploadImage: (formData: FormData, position?: string) => {
    let url = '/advertisements/upload-image';
    if (position) url += `?position=${encodeURIComponent(position)}`;
    return api.upload<any>(url, formData);
  },
  trackImpression: (id: string) => api.post<any>(`/advertisements/${id}/impression`, {}, { requireAuth: false }),
  trackClick: (id: string) => api.post<any>(`/advertisements/${id}/click`, {}, { requireAuth: false }),
  getStats: (id: string) => api.get<any>(`/advertisements/${id}/stats`),
};

export const careerApi = {
  getCareers: (params?: any) => api.get<any[]>('/careers', params, { requireAuth: false }),
  getCareer: (id: string) => api.get<any>(`/careers/${id}`, {}, { requireAuth: false }),
  createCareer: (careerData: any) => api.post<any>('/careers', careerData),
  updateCareer: (id: string, careerData: any) => api.put<any>(`/careers/${id}`, careerData),
  deleteCareer: (id: string) => api.delete<null>(`/careers/${id}`),
  applyToCareer: (id: string, applicationData: FormData) => api.upload<any>(`/careers/${id}/apply`, applicationData),
  getApplications: (params?: any) => api.get<any[]>('/careers/applications', params),
  updateApplicationStatus: (id: string, status: string) => api.patch<any>(`/careers/applications/${id}/status`, { status }),
  getStats: () => api.get<any>('/careers/stats'),
};

export const newsletterApi = {
  subscribe: (email: string) => api.post<{ message: string }>('/newsletter/subscribe', { email }, { requireAuth: false }),
  unsubscribe: (email: string) => api.post<{ message: string }>('/newsletter/unsubscribe', { email }, { requireAuth: false }),
  getSubscribers: (params?: any) => api.get<any[]>('/newsletter', params),
};

export const siteSettingApi = {
  getSettings: () => api.get<any>('/settings', {}, { requireAuth: false }),
  getSetting: (key: string) => api.get<any>(`/settings/${key}`, {}, { requireAuth: false }),
  updateSetting: (key: string, value: any) => api.put<any>(`/settings/${key}`, { value }),
};

export const analyticsApi = {
  trackEvent: (eventData: any) => api.post<any>('/analytics/track', eventData, { requireAuth: false }),
  getAnalytics: (params?: any) => api.get<any>('/analytics', params),
};

export const contactApi = {
  submitContact: (contactData: any) => api.post<{ message: string }>('/contact', contactData, { requireAuth: false }),
  getContacts: (params?: any) => api.get<any[]>('/contact', params),
};

export const shortPostApi = {
  getShortPosts: (params?: any) => api.get<any[]>('/short-posts', params, { requireAuth: false }),
  getShortPost: (id: string) => api.get<any>(`/short-posts/${id}`, {}, { requireAuth: false }),
  createShortPost: (data: any) => api.post<any>('/short-posts', data),
  updateShortPost: (id: string, data: any) => api.put<any>(`/short-posts/${id}`, data),
  deleteShortPost: (id: string) => api.delete<null>(`/short-posts/${id}`),
};

export const reelApi = {
  getReels: (params?: any) => api.get<any[]>('/reels', params, { requireAuth: false }),
  getReel: (id: string) => api.get<any>(`/reels/${id}`, {}, { requireAuth: false }),
  createReel: (data: any) => api.post<any>('/reels', data),
  updateReel: (id: string, data: any) => api.put<any>(`/reels/${id}`, data),
  deleteReel: (id: string) => api.delete<null>(`/reels/${id}`),
};

export const instagramApi = {
  getPosts: (params?: any) => api.get<any[]>('/instagram/posts', params, { requireAuth: false }),
  syncPosts: () => api.post<{ message: string }>('/instagram/sync', {}, { requireAuth: false }),
};

export default api;