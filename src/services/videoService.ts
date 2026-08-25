import { videoApi } from '@/lib/api-client';

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
  data: VideosResponse | null;
  timestamp: number;
  params: string;
} = {
  data: null,
  timestamp: 0,
  params: '',
};

// Get all videos
export const getVideos = async (
  language: 'hindi' | 'english' = 'hindi',
  page: number = 1,
  limit: number = 10,
  category?: string,
  forceRefresh: boolean = false
): Promise<VideosResponse> => {
  try {
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      videoCache = {
        data: null,
        timestamp: 0,
        params: '',
      };
    }

    const params: Record<string, string | number | boolean | undefined> = {
      videoLanguage: language,
      page,
      limit,
      ...(category && { category }),
    };

    const paramsKey = JSON.stringify(params);
    const now = Date.now();
    const cacheValidTime = 30 * 1000;

    // Use cached data if available and not expired (unless forceRefresh is true)
    if (
      !forceRefresh &&
      videoCache.data &&
      videoCache.timestamp > now - cacheValidTime &&
      videoCache.params === paramsKey
    ) {
      return videoCache.data;
    }

    const response = await videoApi.getVideos(params);

    if (!response.success || !response.data) {
      throw new Error('Invalid response format from server');
    }

    // Handle both direct array and paginated response
    let result: VideosResponse;
    if (Array.isArray(response.data)) {
      result = {
        videos: response.data,
        currentPage: page,
        totalPages: 1,
        total: response.data.length,
      };
    } else {
      result = response.data as VideosResponse;
    }

    // Update cache with new data
    videoCache = {
      data: result,
      timestamp: now,
      params: paramsKey,
    };

    return result;
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
export const getVideoById = async (id: string): Promise<VideoType> => {
  const response = await videoApi.getVideo(id);
  if (!response.success || !response.data) {
    throw new Error('Video not found');
  }
  return response.data;
};

// Get featured videos
export const getFeaturedVideos = async (
  language: 'hindi' | 'english' = 'hindi',
  limit: number = 6
): Promise<VideoType[]> => {
  const response = await videoApi.getVideos({ videoLanguage: language, limit, featured: true });
  if (!response.success || !response.data) {
    return [];
  }
  return Array.isArray(response.data) ? response.data : (response.data.videos || []);
};

// Get videos by category
export const getVideosByCategory = async (
  categoryId: string,
  language: 'hindi' | 'english' = 'hindi',
  page: number = 1,
  limit: number = 10
): Promise<VideosResponse> => {
  const response = await videoApi.getVideos({ videoLanguage: language, page, limit, category: categoryId });
  if (!response.success || !response.data) {
    throw new Error('Invalid response format from server');
  }
  if (Array.isArray(response.data)) {
    return {
      videos: response.data,
      currentPage: page,
      totalPages: 1,
      total: response.data.length,
    };
  }
  return response.data as VideosResponse;
};

// Admin functions
// Create a new video
export const createVideo = async (
  videoData: FormData,
  progressCallback?: (event: any) => void
): Promise<VideoType> => {
  try {
    // Setup a longer timeout for video uploads (60 seconds)
    const response = await videoApi.createVideo(videoData);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to upload video');
    }

    // Handle both old and new response formats
    if (response.data && response.data.success === true && response.data.video) {
      return response.data.video;
    }
    return response.data as VideoType;
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
export const updateVideo = async (
  id: string,
  videoData: FormData,
  progressCallback?: (event: any) => void
): Promise<VideoType> => {
  try {
    const response = await videoApi.updateVideo(id, videoData);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update video');
    }

    return response.data as VideoType;
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
export const deleteVideo = async (id: string): Promise<void> => {
  try {
    const response = await videoApi.deleteVideo(id);

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete video');
    }
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