import api from './api';

// Set to false to use real API instead of mock data
const MOCK_MODE = false;

export interface VideoType {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  categoryName: string;
  category: string | { _id: string; name: string };
  author: string | { _id: string; name: string; avatar?: string };
  views: number;
  // Support both the old field name and the new field name for backward compatibility
  language?: 'hindi' | 'english';
  videoLanguage: 'hindi' | 'english';
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  videoPublicId?: string;
  thumbnailPublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryType {
  _id: string;
  id: string; // Frontend compatibility field
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface VideosResponse {
  videos: VideoType[];
  currentPage: number;
  totalPages: number;
  total: number;
}

// Cache for video data to persist between page refreshes
let videoCache: {
  data: VideosResponse | null,
  timestamp: number,
  params: string
} = {
  data: null,
  timestamp: 0,
  params: ''
};

// Get all videos
export const getVideos = async (
  language: 'hindi' | 'english' = 'hindi',
  page: number = 1,
  limit: number = 10,
  category?: string,
  forceRefresh: boolean = false
) => {
  try {
    // Define params object - no admin bypass param; staff status is
    // determined server-side from the JWT token
    interface VideoQueryParams {
      videoLanguage: 'hindi' | 'english';
      page: number;
      limit: number;
      category?: string;
    }
    
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      videoCache = {
        data: null,
        timestamp: 0,
        params: ''
      };
    }
    
    const params: VideoQueryParams = { 
      videoLanguage: language,
      page, 
      limit,
      ...(category && { category }) 
    };
    
    const paramsKey = JSON.stringify(params);
    const now = Date.now();
    const cacheValidTime = 30 * 1000;
    
    // Use cached data if available and not expired (unless forceRefresh is true)
    if (!forceRefresh && 
        videoCache.data && 
        videoCache.timestamp > (now - cacheValidTime) && 
        videoCache.params === paramsKey) {
      return videoCache.data;
    }
    
    // Create timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await api.get<VideosResponse>('/videos', { 
      params,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.data || !response.data.videos) {
      throw new Error('Invalid response format from server');
    }
    
    // Update cache with new data
    videoCache = {
      data: response.data,
      timestamp: now,
      params: paramsKey
    };
    
    return response.data;
  } catch (error: any) {
    console.error('Error in videoService.getVideos:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond. Please try again later.');
    } else if (error.response) {
      throw new Error(`Server error (${error.response.status}): ${error.response.data?.message || 'Unknown server error'}`);
    } else if (error.request) {
      throw new Error('Network error: Could not connect to the server. Please check your connection and ensure the backend is running.');
    } else {
      throw error;
    }
  }
};

// Get a single video by ID
export const getVideoById = async (id: string) => {
  const response = await api.get<VideoType>(`/videos/${id}`);
  return response.data;
};

// Get featured videos
export const getFeaturedVideos = async (
  language: 'hindi' | 'english' = 'hindi',
  limit: number = 6
) => {
  const params = { videoLanguage: language, limit };
  const response = await api.get<VideoType[]>('/videos/featured', { params });
  return response.data;
};

// Get videos by category
export const getVideosByCategory = async (
  categoryId: string,
  language: 'hindi' | 'english' = 'hindi',
  page: number = 1,
  limit: number = 10
) => {
  const params = { videoLanguage: language, page, limit };
  const response = await api.get<VideosResponse>(`/videos/category/${categoryId}`, { params });
  return response.data;
};

// Admin functions
// Create a new video
export const createVideo = async (videoData: FormData, progressCallback?: (event: any) => void): Promise<VideoType> => {
  try {
    // Check for token before attempting upload
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found in storage');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    // Setup a longer timeout for video uploads (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for uploads
    
    const response = await api.post<any>('/videos', videoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: controller.signal,
      // Add progress tracking for large uploads
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`Upload progress: ${percentCompleted}%`);
        if (progressCallback) {
          progressCallback(progressEvent);
        }
      }
    });
    
    clearTimeout(timeoutId);
    
    // Handle both old and new response formats
    if (response.data && response.data.success === true && response.data.video) {
      // New format (success flag with nested video object)
      return response.data.video;
    } else {
      // Old format (direct video object)
      return response.data;
    }
  } catch (error: any) {
    console.error('Error creating video:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout: The server took too long to process your upload. Please try again with a smaller file.');
    } else if (error.response?.status === 413) {
      throw new Error('File too large: The video or thumbnail exceeds the maximum allowed size.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed: Please log in again to upload videos.');
    } else if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to upload video';
      throw new Error(`Server error (${error.response.status}): ${errorMessage}`);
    } else if (error.request) {
      throw new Error('Network error: Could not connect to the server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

// Update a video
export const updateVideo = async (id: string, videoData: FormData, progressCallback?: (event: any) => void) => {
  try {
    // Setup a longer timeout for video uploads (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await api.put<VideoType>(`/videos/${id}`, videoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: controller.signal,
      // Add progress tracking for large uploads
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`Update progress: ${percentCompleted}%`);
        if (progressCallback) {
          progressCallback(progressEvent);
        }
      }
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error: any) {
    console.error('Error updating video:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Update timeout: The server took too long to process your update. Please try again with smaller files.');
    } else if (error.response?.status === 404) {
      throw new Error('Video not found: The video you are trying to update no longer exists.');
    } else if (error.response?.status === 413) {
      throw new Error('File too large: The video or thumbnail exceeds the maximum allowed size.');
    } else if (error.response) {
      throw new Error(`Server error (${error.response.status}): ${error.response.data?.message || 'Failed to update video'}`);
    } else if (error.request) {
      throw new Error('Network error: Could not connect to the server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

// Delete a video
export const deleteVideo = async (id: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await api.delete(`/videos/${id}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting video:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Delete timeout: The server took too long to process your request.');
    } else if (error.response?.status === 404) {
      throw new Error('Video not found: The video you are trying to delete no longer exists.');
    } else if (error.response) {
      throw new Error(`Server error (${error.response.status}): ${error.response.data?.message || 'Failed to delete video'}`);
    } else if (error.request) {
      throw new Error('Network error: Could not connect to the server. Please check your connection.');
    } else {
      throw error;
    }
  }
};
