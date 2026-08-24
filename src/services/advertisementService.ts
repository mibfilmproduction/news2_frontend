import api from './api';
import { mockAdvertisements } from '../mocks/mockData';

// Environment flag to use mock data - set to false to ensure real ads are fetched
const USE_MOCK_DATA = false; // import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

/**
 * Check if an image URL is valid and safe to use
 * @param url Image URL to validate
 * @returns True if the URL is valid and safe to use
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Check if it's a standard URL format that's safe to use
  if (url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('/') ||
      url.startsWith('data:')) {
    return true;
  }
  
  // Explicitly reject blob URLs which might cause issues
  if (url.startsWith('blob:')) {
    console.warn('Advertisement service: Blob URL detected and rejected:', url);
    return false;
  }
  
  // For any other format, reject as potentially unsafe
  return false;
};

/**
 * Generate a fallback image URL if the ad image is invalid
 * @param position Ad position
 * @param title Advertisement title
 * @returns URL for a fallback placeholder image
 */
export const getFallbackImageUrl = (position?: string, title?: string): string => {
  // Create a dynamic color based on position
  const colorMap: {[key: string]: string} = {
    'header': '3b82f6', // blue
    'sidebar': '10b981', // green
    'footer': 'f59e0b', // yellow
    'in-article': 'ef4444', // red
    'breaking-news': '8b5cf6', // purple
    'category-header': '6366f1' // indigo
  };
  const color = position && colorMap[position] ? colorMap[position] : '3b82f6';
  
  // Create a placeholder image with the ad title
  const encodedTitle = encodeURIComponent(title || 'Advertisement');
  return `https://placehold.co/600x${position === 'sidebar' ? '600' : '200'}/${color}/ffffff?text=${encodedTitle}`;
};

export interface Advertisement {
  _id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'header' | 'sidebar' | 'footer' | 'in-article' | 'breaking-news' | 'category-header';
  displayOnPages: string[]; // e.g., ['home', 'category', 'article']
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  publicId?: string; // Cloudinary public ID for managing uploaded images
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
    // If mock data is explicitly enabled, return mock data without API call
    if (USE_MOCK_DATA) {
      console.log('Using mock advertisement data');
      // Filter mock advertisements based on position, page, and language
      return mockAdvertisements.filter(ad => 
        ad.position === position && 
        ad.displayOnPages.includes(page)
      );
    }

    const cacheKey = `${position}-${page}-${language}`;
    const now = Date.now();
    const cacheValidTime = 5 * 60 * 1000; // 5 minutes
    
    // Use cached data if available and valid
    if (
      !forceRefresh && 
      adsCache[cacheKey] && 
      adsCache[cacheKey].timestamp > (now - cacheValidTime)
    ) {
      console.log(`Using cached ads for ${position} on ${page}`);
      return adsCache[cacheKey].data;
    }
    
    // Parameters for filtering ads
    const params = {
      position,
      page,
      language,
      active: true
    };
    
    console.log(`Fetching ads for position: ${position}, page: ${page}`);
    
    // Get advertisements from API
    console.log(`Fetching real advertisements from API for position: ${position}, page: ${page}`);
    
    try {
      // Direct API fetch with minimal filtering to get ALL ads, then filter client-side
      // This ensures we see what's actually in the database
      const response = await api.get('/advertisements');
      
      console.log('Advertisement API full response:', response);
      
      // More flexible response handling
      if (response.data) {
        let adsData: Advertisement[] = [];
        
        if (response.data.data && Array.isArray(response.data.data)) {
          // Standard API response structure
          adsData = response.data.data;
          console.log('Using standard response structure (data.data)', adsData.length);
        } else if (Array.isArray(response.data)) {
          // Direct array response
          adsData = response.data;
          console.log('Using direct array response structure', adsData.length);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Alternative response structure
          adsData = response.data.results;
          console.log('Using alternative response structure (data.results)');
        } else {
          // In case the structure is completely different, log it for debugging
          console.warn('Unexpected API response structure:', response.data);
          // Try to extract data from unknown structure
          if (response.data.advertisements) {
            adsData = Array.isArray(response.data.advertisements) ? response.data.advertisements : [response.data.advertisements];
            console.log('Extracted from custom structure (data.advertisements)');
          }
        }
        
        // Log ALL ads for debugging purposes
        console.log('All advertisements in database:', adsData.map(ad => ({
          id: ad._id,
          title: ad.title,
          position: ad.position,
          pages: ad.displayOnPages,
          active: ad.isActive
        })));
        
        // Apply client-side filtering to ensure we get the right ads and prevent duplicates
        let filteredAds = [];
        
        // First try to find exact position matches that haven't been shown before
        const exactMatches = adsData.filter(ad => {
          const adId = ad._id;
          const isMatch = ad.position === position;
          const notShownBefore = !shownAdsCache[adId];
          return isMatch && notShownBefore;
        });
        
        if (exactMatches.length > 0) {
          // If we have exact position matches that haven't been shown, use those
          console.log(`Found ${exactMatches.length} unused exact position matches for ${position}`);
          
          // Take one random exact match
          const randomIndex = Math.floor(Math.random() * exactMatches.length);
          filteredAds = [exactMatches[randomIndex]];
        } else {
          // If all exact matches have been shown or there are none, check if we should reuse already shown ads
          const allExactMatches = adsData.filter(ad => ad.position === position);
          
          if (allExactMatches.length > 0) {
            console.log(`Found ${allExactMatches.length} position matches for ${position}, but they've been shown before`);
            // Reuse the exact matches if we've shown all ads
            const randomIndex = Math.floor(Math.random() * allExactMatches.length);
            filteredAds = [allExactMatches[randomIndex]];
          } else {
            // If no exact matches at all, return ANY active ad that hasn't been shown
            console.log(`No exact matches for position ${position}, using any available unused ad`);
            
            // Prioritize active ads that haven't been shown before
            const unusedActiveAds = adsData.filter(ad => ad.isActive === true && !shownAdsCache[ad._id]);
            
            if (unusedActiveAds.length > 0) {
              // Pick a random active ad to display
              const randomIndex = Math.floor(Math.random() * unusedActiveAds.length);
              filteredAds = [unusedActiveAds[randomIndex]];
              console.log(`Selected random unused active ad: ${filteredAds[0].title} (original position: ${filteredAds[0].position})`);
            } else {
              // If all active ads have been shown, just pick any active ad
              const activeAds = adsData.filter(ad => ad.isActive === true);
              
              if (activeAds.length > 0) {
                const randomIndex = Math.floor(Math.random() * activeAds.length);
                filteredAds = [activeAds[randomIndex]];
                console.log(`All ads have been shown, reusing: ${filteredAds[0].title}`);
              } else if (adsData.length > 0) {
                // Last resort: use any ad as fallback
                const randomIndex = Math.floor(Math.random() * adsData.length);
                filteredAds = [adsData[randomIndex]];
                console.log(`No active ads available, using inactive ad as fallback: ${filteredAds[0].title}`);
              }
            }
          }
        }
        
        // Mark the ads as shown to prevent duplicates
        if (filteredAds.length > 0) {
          filteredAds.forEach(ad => {
            shownAdsCache[ad._id] = true;
            console.log(`Marked ad ${ad.title} (${ad._id}) as shown`);
          });
        }
        
        // Log data for debugging
        console.log(`Found ${adsData.length} total advertisements, ${filteredAds.length} matching position=${position}`);
        
        // Update cache
        adsCache[cacheKey] = {
          data: filteredAds,
          timestamp: now
        };
        
        return filteredAds;
      }
      return []; // Return empty array if no data
    } catch (apiError) {
      console.error('API error when fetching advertisements:', apiError);
      // Continue to use mock data as fallback
      return [];
    }
    
    console.log(`No advertisements found for ${position} on ${page}`);
    return [];
  } catch (error) {
    console.error(`Error fetching advertisements for position ${position} on ${page}:`, error);
    
    // For debugging, check if we're getting 401 errors on the frontend
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Return mock data on API failure
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
    // Skip API call if we're in mock mode
    if (USE_MOCK_DATA) {
      console.log(`[Mock] Tracked impression for ad ${adId}`);
      return;
    }
    
    // Try to call the real API endpoint
    await api.post(`/advertisements/${adId}/impression`);
  } catch (error) {
    // Still log the error but don't crash
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
    // Skip API call if we're in mock mode
    if (USE_MOCK_DATA) {
      console.log(`[Mock] Tracked click for ad ${adId}`);
      return;
    }
    
    // Try to call the real API endpoint
    await api.post(`/advertisements/${adId}/click`);
  } catch (error) {
    // Still log the error but don't crash
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
    // Get authentication token to ensure it's present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make the API call with explicit headers
    const response = await api.post('/advertisements', adData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if the data structure is as expected
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // If the API returns data directly
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
    // Get authentication token to ensure it's present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make the API call with explicit headers
    const response = await api.put(`/advertisements/${adId}`, adData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if the data structure is as expected
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // If the API returns data directly
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
    // Get authentication token to ensure it's present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make the API call with explicit headers
    await api.delete(`/advertisements/${adId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
    // Get authentication token to ensure it's present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Make the API call with explicit headers
    const response = await api.get(`/advertisements/${adId}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if the data structure is as expected
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      // If the API returns data directly
      return response.data;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error(`Error fetching statistics for advertisement ${adId}:`, error);
    throw error;
  }
};
