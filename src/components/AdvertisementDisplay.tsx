import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

// Import from the correct path
import { Advertisement, getAdvertisements, trackAdImpression, trackAdClick } from '@/services/advertisementService';
import { isValidImageUrl, getFallbackImageUrl } from '@/services/advertisementService';

interface AdvertisementDisplayProps {
  position: Advertisement['position'];
  className?: string;
  onlyShowOne?: boolean; // If true, ensure ad is only shown if no other ad has been shown
}

// Track which ad positions have been shown using this global variable
const shownAdPositions = new Set<string>();

const AdvertisementDisplay: React.FC<AdvertisementDisplayProps> = ({ 
  position,
  className = '',
  onlyShowOne = false
}) => {
  const location = useLocation();
  
  // Determine the current page
  const getPageFromPath = (path: string): string => {
    if (path === '/') return 'home';
    if (path.startsWith('/category')) return 'category';
    if (path.startsWith('/article')) return 'article';
    if (path.startsWith('/video')) return 'video';
    if (path.startsWith('/live-tv')) return 'live-tv';
    if (path.startsWith('/short-post')) return 'short-post';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    
    // Fallback
    return 'other';
  };
  
  const currentPage = getPageFromPath(location.pathname);
  
  // Get language preference from localStorage or default to hindi
  const language = localStorage.getItem('language') as 'hindi' | 'english' || 'hindi';
  
  // State to track loading errors
  const [hasError, setHasError] = useState(false);

  // Fetch advertisements for this position and current page
  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ['advertisements', position, currentPage, language],
    queryFn: async () => {
      try {
        console.log(`AdvertisementDisplay: Fetching ads for position=${position}, page=${currentPage}, language=${language}`);
        
        // Always force refresh to ensure we're getting the latest ads from the database
        const ads = await getAdvertisements(position, currentPage, language, true);
        
        if (ads && ads.length > 0) {
          console.log(`AdvertisementDisplay: Successfully retrieved ${ads.length} ads for ${position}`);
          console.log('Advertisement details:', ads.map(ad => ({
            id: ad._id,
            title: ad.title,
            position: ad.position,
            isActive: ad.isActive,
            pages: ad.displayOnPages
          })));
        } else {
          console.warn(`AdvertisementDisplay: No ads found for position=${position}, page=${currentPage}`);
        }
        
        return ads;
      } catch (err) {
        console.error(`AdvertisementDisplay: Error loading advertisements for ${position}:`, err);
        setHasError(true);
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - shorter stale time to refresh more often
    retry: 2, // Retry twice to handle temporary network issues
    refetchOnWindowFocus: true // Refetch when the window regains focus
  });
  
  // Track impressions when ads are loaded
  useEffect(() => {
    if (advertisements && advertisements.length > 0) {
      console.log(`Tracking impressions for ${advertisements.length} ads in ${position}`);
      // Track impression for each ad
      advertisements.forEach(ad => {
        trackAdImpression(ad._id);
      });
    }
  }, [advertisements, position]);
  
  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error(`Advertisement fetch error for ${position}:`, error);
    }
  }, [error, position]);
  
  // Handle ad click
  const handleAdClick = (ad: Advertisement) => {
    trackAdClick(ad._id);
  };
  
  // Track whether this specific ad instance has been closed by the user
  const [adClosed, setAdClosed] = useState(false);
  
  // Check if we should display this ad based on whether other ads have been shown
  const shouldShowAd = () => {
    if (adClosed) return false;
    
    if (onlyShowOne) {
      // If this is the first ad to be shown, mark it and allow it
      if (shownAdPositions.size === 0) {
        shownAdPositions.add(position);
        return true;
      }
      // Otherwise, only show if this specific position hasn't been shown yet
      return !shownAdPositions.has(position);
    }
    
    return true;
  };
  
  // Generate CSS classes based on position
  const getPositionClasses = (position: Advertisement['position']): string => {
    switch (position) {
      case 'header':
        return 'w-full h-[120px] my-4';
      case 'sidebar':
        return 'w-full h-[300px] my-4';
      case 'footer':
        return 'w-full h-[250px] my-4';
      case 'in-article':
        return 'w-full h-[100px] my-6';
      case 'breaking-news':
        return 'w-full h-[90px] my-4';
      case 'category-header':
        return 'w-full h-[250px] my-4';
      default:
        return 'w-full h-[90px] my-4';
    }
  };
  
  // Handle closing the ad
  const handleCloseAd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdClosed(true);
    // Also mark this position as shown to prevent other ads from replacing it
    shownAdPositions.add(position);
  };
  
  // If loading or error, show appropriate message or placeholder
  // Check if we should show this ad
  if (!shouldShowAd()) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`advertisement-container ${getPositionClasses(position)} ${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-sm text-gray-400">Loading advertisement...</span>
      </div>
    );
  }
  
  // If no ads are available, return null or a placeholder
  if (!advertisements || advertisements.length === 0) {
    if (hasError) {
      console.log(`Error loading ads for ${position}, showing placeholder`);
      return (
        <div className={`advertisement-container ${getPositionClasses(position)} ${className} bg-gray-100 flex items-center justify-center border border-gray-200`}>
          <span className="text-sm text-gray-400">Advertisement</span>
        </div>
      );
    }
    return null;
  }
  
  // Get random ad from available advertisements
  const randomIndex = Math.floor(Math.random() * advertisements!.length);
  const ad = advertisements![randomIndex];

  // Ensure targetUrl has a fallback
  const targetUrl = ad.targetUrl || '#';
  
  // Use the utility functions imported from advertisementService.ts

  // Determine image source with fallback
  const imageUrl = isValidImageUrl(ad.imageUrl) ? 
    ad.imageUrl : 
    getFallbackImageUrl(ad.position, ad.title);

  // Mark this ad position as shown
  shownAdPositions.add(position);

  return (
    <div className={`advertisement-container ${getPositionClasses(position)} ${className} relative`}>
      <a 
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleAdClick(ad)}
        className="block w-full h-full relative overflow-hidden"
      >
        <img 
          src={imageUrl} 
          alt={ad.title}
          className="w-full h-full object-cover hover:opacity-95 transition-opacity"
          onError={(e) => {
            console.log(`Image error for ad: ${ad.title}`, ad.imageUrl);
            // If the image fails to load, replace with fallback
            e.currentTarget.onerror = null; // Prevent infinite error loops
            e.currentTarget.src = getFallbackImageUrl(ad.position, ad.title);
          }}
        />
        <span className="absolute right-1 top-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
          Ad
        </span>
      </a>
      
      {/* Close button */}
      <button 
        onClick={handleCloseAd}
        className="absolute top-1 left-1 bg-white/80 rounded-full p-1 hover:bg-white transition-colors z-10"
        aria-label="Close advertisement"
      >
        <X size={16} className="text-gray-600" />
      </button>
    </div>
  );
};

export default AdvertisementDisplay;
