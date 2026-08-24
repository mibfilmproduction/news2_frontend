import api from './api';

// Define the LiveTvChannel interface
export interface LiveTvChannel {
  id?: string; // For backend compatibility
  _id: string; // MongoDB ID used in frontend
  title: string;
  description?: string;
  category: string;
  language: string;
  streamUrl: string;
  thumbnailUrl?: string;
  isLive: boolean;
  isFeatured: boolean;
  order: number;
  viewCount: number; // View count for analytics
  createdAt?: Date;
  updatedAt?: Date;
}

// Normalize a channel from the backend (thumbnailImage -> thumbnailUrl)
const normalizeChannel = (raw: any): LiveTvChannel => ({
  id: raw._id,
  _id: raw._id,
  title: raw.title,
  description: raw.description || '',
  category: raw.category,
  language: raw.language,
  streamUrl: raw.streamUrl,
  thumbnailUrl: raw.thumbnailImage || raw.thumbnailUrl || '',
  isLive: !!raw.isLive,
  isFeatured: !!raw.isFeatured,
  order: raw.order || 0,
  viewCount: raw.viewCount || 0,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

// Build a FormData payload for create/update (file upload support)
const buildFormData = (data: Partial<LiveTvChannel>, thumbnailFile?: File | null) => {
  const form = new FormData();
  form.append('title', data.title || '');
  form.append('description', data.description || '');
  form.append('streamUrl', data.streamUrl || '');
  form.append('category', data.category || 'general');
  form.append('language', data.language || 'both');
  form.append('isLive', String(!!data.isLive));
  form.append('isFeatured', String(!!data.isFeatured));
  form.append('order', String(data.order ?? 0));
  if (thumbnailFile) {
    form.append('thumbnailImage', thumbnailFile);
  } else if (data.thumbnailUrl && data.thumbnailUrl.startsWith('http')) {
    form.append('thumbnailUrl', data.thumbnailUrl);
  }
  return form;
};

/**
 * Fetches live TV channels from the API
 * @param options Options for filtering and pagination
 * @returns Object containing channels data and pagination info
 */
export const getLiveTvChannels = async (options: {
  page?: number;
  limit?: number;
  category?: string;
  language?: string;
  featured?: boolean;
} = {}): Promise<{ channels: LiveTvChannel[]; pages: number; total: number }> => {
  const { page = 1, limit = 10, category, language, featured } = options;

  const params: any = { page, limit };
  if (category) params.category = category;
  if (language) params.language = language;
  if (featured !== undefined) params.featured = featured;

  const response = await api.get<any>('/live-tv', { params });

  const data = response.data?.data || [];
  const channels = data.map(normalizeChannel);
  return {
    channels,
    pages: response.data?.pages || Math.ceil((response.data?.count || channels.length) / limit),
    total: response.data?.count || channels.length,
  };
};

/**
 * Fetches a single live TV channel by ID
 * @param id Channel ID
 * @returns Channel data
 */
export const getLiveTvChannel = async (id: string): Promise<LiveTvChannel | null> => {
  try {
    const response = await api.get<any>(`/live-tv/${id}`);
    return response.data?.data ? normalizeChannel(response.data.data) : null;
  } catch (error) {
    console.error('Error fetching live TV channel:', error);
    return null;
  }
};

/**
 * Creates a new live TV channel
 * @param channelData Channel data to create
 * @param thumbnailFile Optional thumbnail image file
 * @returns Created channel data
 */
export const createLiveTvChannel = async (
  channelData: Partial<LiveTvChannel>,
  thumbnailFile?: File | null
): Promise<LiveTvChannel> => {
  const response = await api.post<any>('/live-tv', buildFormData(channelData, thumbnailFile));
  return normalizeChannel(response.data.data);
};

/**
 * Updates an existing live TV channel
 * @param id Channel ID to update
 * @param channelData Updated channel data
 * @param thumbnailFile Optional thumbnail image file
 * @returns Updated channel data
 */
export const updateLiveTvChannel = async (
  id: string,
  channelData: Partial<LiveTvChannel>,
  thumbnailFile?: File | null
): Promise<LiveTvChannel | null> => {
  const response = await api.put<any>(`/live-tv/${id}`, buildFormData(channelData, thumbnailFile));
  return response.data?.data ? normalizeChannel(response.data.data) : null;
};

/**
 * Toggles the featured status of a channel
 * @param id Channel ID
 * @returns Updated channel data
 */
export const toggleChannelFeatured = async (id: string): Promise<LiveTvChannel | null> => {
  const response = await api.put<any>(`/live-tv/${id}/toggle-featured`);
  const channel = await getLiveTvChannel(id);
  return channel;
};

/**
 * Deletes a live TV channel
 * @param id Channel ID to delete
 * @returns boolean indicating success
 */
export const deleteLiveTvChannel = async (id: string): Promise<boolean> => {
  const response = await api.delete<any>(`/live-tv/${id}`);
  return response.data?.success === true;
};

/**
 * Gets all available live TV categories
 * @returns List of categories
 */
export const getLiveTvCategories = async (): Promise<string[]> => {
  const response = await api.get<any>('/live-tv/categories');
  const data = response.data?.data || [];
  if (data.length > 0) {
    return data;
  }
  return ['news', 'entertainment', 'sports', 'business', 'education', 'international', 'regional', 'technology', 'music', 'movies', 'lifestyle', 'general'];
};

/**
 * Fetches channels from the external IPTV API
 * This would be used to populate the database with real channels
 */
export const fetchExternalChannels = async (): Promise<any[]> => {
  const response = await fetch('https://iptv-org.github.io/api/channels.json');
  if (!response.ok) throw new Error('Failed to fetch external channels');
  return response.json();
};