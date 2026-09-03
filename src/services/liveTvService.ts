import { liveTvApi } from '@/lib/api-client';

// Define the LiveTvChannel interface
export interface LiveTvChannel {
  id?: string;
  _id: string;
  title: string;
  description?: string;
  category: string;
  language: string;
  streamUrl: string;
  thumbnailUrl?: string;
  isLive: boolean;
  isFeatured: boolean;
  order: number;
  viewCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Normalize a channel from the backend
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

// Build a FormData payload for create/update
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

  const params: Record<string, string | number | boolean | undefined> = { page, limit };
  if (category) params.category = category;
  if (language) params.language = language;
  if (featured !== undefined) params.featured = featured;

  const [response, externalResponse] = await Promise.all([
    liveTvApi.getChannels(params),
    page === 1 ? liveTvApi.getIndiaChannels({ limit, category, language }).catch(() => null) : Promise.resolve(null),
  ]);

  if (!response.success) throw new Error(response.message || 'Failed to load live TV channels');
  const data = Array.isArray(response.data) ? response.data : [];
  const externalData = externalResponse?.success && Array.isArray(externalResponse.data)
    ? externalResponse.data
    : [];
  const channels = [...data, ...externalData]
    .map(normalizeChannel)
    .filter((channel, index, all) => all.findIndex(item => item.streamUrl === channel.streamUrl) === index);
  return {
    channels,
    pages: response.pages || Math.ceil((response.count || channels.length) / limit),
    total: (response.count || data.length) + externalData.length,
  };
};

/**
 * Fetches a single live TV channel by ID
 * @param id Channel ID
 * @returns Channel data
 */
export const getLiveTvChannel = async (id: string): Promise<LiveTvChannel | null> => {
  try {
    const response = await liveTvApi.getChannel(id);
    return response.success && response.data ? normalizeChannel(response.data) : null;
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
  const response = await liveTvApi.createChannel(buildFormData(channelData, thumbnailFile));
  if (!response.success || !response.data) throw new Error(response.message || 'Failed to create channel');
  return normalizeChannel(response.data);
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
  const response = await liveTvApi.updateChannel(id, buildFormData(channelData, thumbnailFile));
  return response.success && response.data ? normalizeChannel(response.data) : null;
};

/**
 * Toggles the featured status of a channel
 * @param id Channel ID
 * @returns Updated channel data
 */
export const toggleChannelFeatured = async (id: string): Promise<LiveTvChannel | null> => {
  const response = await liveTvApi.toggleFeatured(id);
  const channel = await getLiveTvChannel(id);
  return channel;
};

/**
 * Deletes a live TV channel
 * @param id Channel ID to delete
 * @returns boolean indicating success
 */
export const deleteLiveTvChannel = async (id: string): Promise<boolean> => {
  const response = await liveTvApi.deleteChannel(id);
  return response.success === true;
};

/**
 * Gets all available live TV categories
 * @returns List of categories
 */
export const getLiveTvCategories = async (): Promise<string[]> => {
  const response = await liveTvApi.getCategories();
  const data = Array.isArray(response.data) ? response.data : [];
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
  const response = await liveTvApi.getIndiaChannels({ limit: 300 });
  if (!response.success) throw new Error(response.message || 'Failed to fetch external channels');
  return Array.isArray(response.data) ? response.data : [];
};
