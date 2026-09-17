import { advertisementApi, api } from '@/lib/api-client';
import { mockAdvertisements } from '../mocks/mockData';

// Environment flag to use mock data - set to false to ensure real ads are fetched
const USE_MOCK_DATA = false;

/**
 * Check if an image URL is valid and safe to use
 * @param url Image URL to validate
 * @returns True if the URL is valid and safe to use
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  if (url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('/') ||
      url.startsWith('data:')) {
    return true;
  }
  
  if (url.startsWith('blob:')) {
    console.warn('Advertisement service: Blob URL detected and rejected:', url);
    return false;
  }
  
  return false;
};

/**
 * Generate a fallback image URL if the ad image is invalid
 * @param position Ad position
 * @param title Advertisement title
 * @returns URL for a fallback placeholder image
 */
export const getFallbackImageUrl = (position?: string, title?: string): string => {
  const colorMap: {[key: string]: string} = {
    'header': '3b82f6',
    'sidebar': '10b981',
    'footer': 'f59e0b',
    'in-article': 'ef4444',
    'breaking-news': '8b5cf6',
    'category-header': '6366f1',
    'category-square': '0ea5e9'
  };
  const color = position && colorMap[position] ? colorMap[position] : '3b82f6';
  
  const encodedTitle = encodeURIComponent(title || 'Advertisement');
  return `https://placehold.co/600x${position === 'sidebar' ? '600' : '200'}/${color}/ffffff?text=${encodedTitle}`;
};

export interface Advertisement {
  _id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'header' | 'sidebar' | 'footer' | 'in-article' | 'breaking-news' | 'category-header' | 'category-square';
  displayOnPages: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  publicId?: string;
}

// Cache mechanism to prevent excessive API calls
const adsCache: { [key: string]: { data: Advertisement[], timestamp: number } } = {};

/**
 * Clear the ads cache (e.g. after an admin creates/updates/deletes an ad
 * so the new position shows immediately on the frontend).
 */
export const clearAdsCache = () => {
  Object.keys(adsCache).forEach((key) => delete adsCache[key]);
};

/** @deprecated Use clearAdsCache instead (kept for backward compat). */
export const resetAdCache = () => clearAdsCache();

/**
 * Fetch EVERY advertisement for the admin management table.
 * Uses page=admin so the backend skips position/page/date filtering.
 */
export const getAllAdvertisementsForAdmin = async (): Promise<Advertisement[]> => {
  const response = await advertisementApi.getAdvertisements({ page: 'admin' });
  const payload: any = response.data;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.advertisements)) return payload.advertisements;
  return [];
};

/**
 * Get advertisements for a specific position and page
 * @param position - Ad position (header, sidebar, footer, etc.)
 * @param page - Page name (home, article, category, etc.)
 * @param language - Content language
 * @param forceRefresh - Force bypass cache
 * @returns Array of advertisements
 */
export const getAdvertisements = async (
  position?: string,
  page?: string,
  language = 'hindi',
  forceRefresh = false
): Promise<Advertisement[]> => {
  try {
    if (USE_MOCK_DATA) {
      console.log('Using mock advertisement data');
      return mockAdvertisements.filter(ad => 
        ad.position === position && 
        ad.displayOnPages.includes(page)
      );
    }

    const cacheKey = `${position}-${page}-${language}`;
    const now = Date.now();
    const cacheValidTime = 5 * 60 * 1000;
    
    if (
      !forceRefresh && 
      adsCache[cacheKey] && 
      adsCache[cacheKey].timestamp > (now - cacheValidTime)
    ) {
      console.log(`Using cached ads for ${position} on ${page}`);
      return adsCache[cacheKey].data;
    }
    
    const params = {
      position,
      page,
      language,
      active: true
    };
    
    console.log(`Fetching ads for position: ${position}, page: ${page}`);
    
    try {
      const response = await advertisementApi.getAdvertisements(params);

      if (response.data) {
        let adsData: Advertisement[] = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          adsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          adsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          adsData = response.data.results;
        } else {
          console.warn('Unexpected API response structure:', response.data);
          if (response.data.advertisements) {
            adsData = Array.isArray(response.data.advertisements) ? response.data.advertisements : [response.data.advertisements];
          }
        }

        // The backend already filters by position + page + language +
        // active + date range, so return its result as-is. Showing a
        // wrong-position ad as "fallback" only confuses admins ("I added a
        // footer ad but a header ad shows in the footer slot").
        const filteredAds = adsData.filter((ad) => ad.position === position);

        adsCache[cacheKey] = {
          data: filteredAds,
          timestamp: now
        };

        return filteredAds;
      }
      return [];
    } catch (apiError) {
      console.error('API error when fetching advertisements:', apiError);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching advertisements for position ${position} on ${page}:`, error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('API failed, using mock advertisement data');
    return mockAdvertisements.filter(ad => 
      ad.position === position && 
      ad.displayOnPages.includes(page)
    );
  }
};

/**
 * Track an advertisement impression
 * @param adId - The advertisement ID
 */
export const trackAdImpression = async (adId: string): Promise<void> => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`[Mock] Tracked impression for ad ${adId}`);
      return;
    }
    
    await advertisementApi.trackImpression(adId);
  } catch (error) {
    console.error(`Error tracking ad impression for ${adId}:`, error);
  }
};

/**
 * Track an advertisement click
 * @param adId - The advertisement ID
 */
export const trackAdClick = async (adId: string): Promise<void> => {
  try {
    if (USE_MOCK_DATA) {
      console.log(`[Mock] Tracked click for ad ${adId}`);
      return;
    }
    
    await advertisementApi.trackClick(adId);
  } catch (error) {
    console.error(`Error tracking ad click for ${adId}:`, error);
  }
};

// Admin-only functions

/**
 * Create a new advertisement (admin only)
 */
export const createAdvertisement = async (adData: Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>): Promise<Advertisement> => {
  try {
    const response = await advertisementApi.createAdvertisement(adData);
    clearAdsCache();
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error creating advertisement:', error);
    throw error;
  }
};

/**
 * Update an advertisement (admin only)
 */
export const updateAdvertisement = async (adId: string, adData: Partial<Advertisement>): Promise<Advertisement> => {
  try {
    const response = await advertisementApi.updateAdvertisement(adId, adData);
    clearAdsCache();
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error(`Error updating advertisement ${adId}:`, error);
    throw error;
  }
};

/**
 * Delete an advertisement (admin only)
 */
export const deleteAdvertisement = async (adId: string): Promise<void> => {
  try {
    await advertisementApi.deleteAdvertisement(adId);
    clearAdsCache();
  } catch (error) {
    console.error(`Error deleting advertisement ${adId}:`, error);
    throw error;
  }
};

/**
 * Get advertisement statistics (admin only)
 */
export const getAdvertisementStats = async (adId: string): Promise<{
  impressions: number;
  clicks: number;
  ctr: number;
}> => {
  try {
    const response = await advertisementApi.getAdvertisementStats?.(adId) ??
      await api.get(`/advertisements/${adId}/stats`);
    
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error(`Error fetching statistics for advertisement ${adId}:`, error);
    throw error;
  }
};