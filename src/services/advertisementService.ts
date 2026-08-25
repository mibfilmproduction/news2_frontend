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
    'category-header': '6366f1'
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
  position: 'header' | 'sidebar' | 'footer' | 'in-article' | 'breaking-news' | 'category-header';
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

// Track which ads have been shown to prevent duplicates
let shownAdsCache: { [key: string]: boolean } = {};

/**
 * Reset the shown ads tracking cache
 * Call this when navigating to a new page to allow ads to be reshown
 */
export const resetAdCache = () => {
  console.log('Resetting advertisement shown cache');
  shownAdsCache = {};
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
      
      console.log('Advertisement API full response:', response);
      
      if (response.data) {
        let adsData: Advertisement[] = [];
        
        if (response.data.data && Array.isArray(response.data.data)) {
          adsData = response.data.data;
          console.log('Using standard response structure (data.data)', adsData.length);
        } else if (Array.isArray(response.data)) {
          adsData = response.data;
          console.log('Using direct array response structure', adsData.length);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          adsData = response.data.results;
          console.log('Using alternative response structure (data.results)');
        } else {
          console.warn('Unexpected API response structure:', response.data);
          if (response.data.advertisements) {
            adsData = Array.isArray(response.data.advertisements) ? response.data.advertisements : [response.data.advertisements];
            console.log('Extracted from custom structure (data.advertisements)');
          }
        }
        
        console.log('All advertisements in database:', adsData.map(ad => ({
          id: ad._id,
          title: ad.title,
          position: ad.position,
          pages: ad.displayOnPages,
          active: ad.isActive
        })));
        
        let filteredAds = [];
        
        const exactMatches = adsData.filter(ad => {
          const adId = ad._id;
          const isMatch = ad.position === position;
          const notShownBefore = !shownAdsCache[adId];
          return isMatch && notShownBefore;
        });
        
        if (exactMatches.length > 0) {
          console.log(`Found ${exactMatches.length} unused exact position matches for ${position}`);
          const randomIndex = Math.floor(Math.random() * exactMatches.length);
          filteredAds = [exactMatches[randomIndex]];
        } else {
          const allExactMatches = adsData.filter(ad => ad.position === position);
          
          if (allExactMatches.length > 0) {
            console.log(`Found ${allExactMatches.length} position matches for ${position}, but they've been shown before`);
            const randomIndex = Math.floor(Math.random() * allExactMatches.length);
            filteredAds = [allExactMatches[randomIndex]];
          } else {
            console.log(`No exact matches for position ${position}, using any available unused ad`);
            
            const unusedActiveAds = adsData.filter(ad => ad.isActive === true && !shownAdsCache[ad._id]);
            
            if (unusedActiveAds.length > 0) {
              const randomIndex = Math.floor(Math.random() * unusedActiveAds.length);
              filteredAds = [unusedActiveAds[randomIndex]];
              console.log(`Selected random unused active ad: ${filteredAds[0].title} (original position: ${filteredAds[0].position})`);
            } else {
              const activeAds = adsData.filter(ad => ad.isActive === true);
              
              if (activeAds.length > 0) {
                const randomIndex = Math.floor(Math.random() * activeAds.length);
                filteredAds = [activeAds[randomIndex]];
                console.log(`All ads have been shown, reusing: ${filteredAds[0].title}`);
              } else if (adsData.length > 0) {
                const randomIndex = Math.floor(Math.random() * adsData.length);
                filteredAds = [adsData[randomIndex]];
                console.log(`No active ads available, using inactive ad as fallback: ${filteredAds[0].title}`);
              }
            }
          }
        }
        
        if (filteredAds.length > 0) {
          filteredAds.forEach(ad => {
            shownAdsCache[ad._id] = true;
            console.log(`Marked ad ${ad.title} (${ad._id}) as shown`);
          });
        }
        
        console.log(`Found ${adsData.length} total advertisements, ${filteredAds.length} matching position=${position}`);
        
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
    
    await api.post(`/advertisements/${adId}/impression`);
  } catch (error) {
    console.error(`Error tracking ad impression for ${adId}:`, error);
    console.log(`[Fallback] Tracked impression for ad ${adId} locally only`);
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
    
    await api.post(`/advertisements/${adId}/click`);
  } catch (error) {
    console.error(`Error tracking ad click for ${adId}:`, error);
    console.log(`[Fallback] Tracked click for ad ${adId} locally only`);
  }
};

// Admin-only functions

/**
 * Create a new advertisement (admin only)
 */
export const createAdvertisement = async (adData: Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>): Promise<Advertisement> => {
  try {
    const response = await advertisementApi.createAdvertisement(adData);
    
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