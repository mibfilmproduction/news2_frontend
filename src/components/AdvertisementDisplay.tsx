import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Import from the correct path
import { Advertisement, getAdvertisements, trackAdImpression, trackAdClick } from '@/services/advertisementService';
import { isValidImageUrl, getFallbackImageUrl } from '@/services/advertisementService';

interface AdvertisementDisplayProps {
  position: Advertisement['position'];
  className?: string;
  /** @deprecated No longer used — every position renders its own ad. Kept for backward compat. */
  onlyShowOne?: boolean;
  /**
   * Which ad to show when several ads share this position.
   * Each slot on the page passes a different index, so every slot shows
   * a DIFFERENT admin ad (same size, different content).
   */
  slotIndex?: number;
  /**
   * Force how the creative renders:
   * - 'auto' (default): size defined by the ad position.
   * - 'strip': full-width slim banner (80px tall), used to alternate
   *   square ads as square -> banner -> square across slots.
   */
  variant?: 'auto' | 'strip';
}

/**
 * Real-ad sizing per position. These match the Cloudinary transformations
 * applied at upload time on the backend, so creatives render pixel-perfect
 * (same-to-same) with zero cropping or stretching.
 */
const POSITION_STYLE: Record<
  Advertisement['position'],
  { container: string; maxHeight: number; strip?: boolean }
> = {
  'header': { container: 'max-w-[970px]', maxHeight: 90 },
  'sidebar': { container: 'max-w-[300px]', maxHeight: 600 },
  'footer': { container: 'max-w-[728px]', maxHeight: 90 },
  // Small full-width strip banner — same height as a related article card
  'in-article': { container: '', maxHeight: 80, strip: true },
  'breaking-news': { container: 'max-w-[300px]', maxHeight: 250 },
  'category-header': { container: 'max-w-[728px]', maxHeight: 90 },
  // Compact 200x200 square, centered in its column
  'category-square': { container: 'max-w-[200px]', maxHeight: 200 },
};

/** Slim strip height = related-article card height (fixed, all positions). */
const STRIP_HEIGHT = 80;

const AdvertisementDisplay: React.FC<AdvertisementDisplayProps> = ({
  position,
  className = '',
  slotIndex = 0,
  variant = 'auto',
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

  // Fetch advertisements for this position and current page
  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ['advertisements', position, currentPage, language],
    queryFn: async () => {
      // getAdvertisements already returns only ads matching this exact
      // position (backend-filtered). No client-side re-picking here.
      const ads = await getAdvertisements(position, currentPage, language, true);
      return ads;
    },
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Pick ONE stable ad per fetched list. With slotIndex, each slot on the
  // page shows a different ad (rotated across all ads of this position).
  const ad = useMemo(() => {
    if (!advertisements || advertisements.length === 0) return null;
    return advertisements[slotIndex % advertisements.length];
  }, [advertisements, slotIndex]);

  // Track impression exactly once per ad (StrictMode-safe).
  const trackedAdIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (ad && trackedAdIdRef.current !== ad._id) {
      trackedAdIdRef.current = ad._id;
      trackAdImpression(ad._id);
    }
  }, [ad]);
  
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

  // No dummy/placeholder boxes: render nothing while loading,
  // on error, or when no real ad exists for this position.
  if (isLoading || error || !ad) {
    return null;
  }

  // Ensure targetUrl has a fallback
  const targetUrl = ad.targetUrl || '#';

  // Determine image source with fallback
  const imageUrl = isValidImageUrl(ad.imageUrl) ?
    ad.imageUrl :
    getFallbackImageUrl(ad.position, ad.title);

  const style = POSITION_STYLE[position] ?? POSITION_STYLE.header;
  const isStrip = variant === 'strip' || style.strip === true;

  return (
    <div
      className={`advertisement w-full ${isStrip ? '' : style.container} mx-auto my-4 flex flex-col items-center ${className}`}
      role="complementary"
      aria-label={`Advertisement: ${ad.title}`}
    >
      {/* Industry-standard micro label, like Google AdSense / real news sites */}
      <span className="mb-1 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
        Advertisement
      </span>
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleAdClick(ad)}
        className="block w-full"
      >
        <img
          src={imageUrl}
          alt={ad.title}
          loading="lazy"
          decoding="async"
          style={isStrip ? { height: STRIP_HEIGHT, width: '100%' } : { maxHeight: style.maxHeight }}
          className={isStrip
            ? "mx-auto w-full border border-gray-200 bg-white object-cover hover:opacity-95 transition-opacity"
            : "mx-auto h-auto w-auto max-w-full border border-gray-200 bg-white object-contain hover:opacity-95 transition-opacity"}
          onError={(e) => {
            // If the image fails to load, replace with fallback
            e.currentTarget.onerror = null; // Prevent infinite error loops
            e.currentTarget.src = getFallbackImageUrl(ad.position, ad.title);
          }}
        />
      </a>
    </div>
  );
};

export default AdvertisementDisplay;
