import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Import from the correct path
import { Advertisement, getAdvertisements, trackAdImpression, trackAdClick } from '@/services/advertisementService';
import { ADS_CHANGED_STORAGE_KEY, isValidImageUrl, getFallbackImageUrl } from '@/services/advertisementService';

interface AdvertisementDisplayProps {
  position: Advertisement['position'];
  className?: string;
  /** @deprecated No longer used — every position renders its own ad. Kept for backward compat. */
  onlyShowOne?: boolean;
  /**
   * Which ad to show when several ads share this position.
   * Each slot on the page passes a different index, so every slot shows
   * a DIFFERENT admin ad. If there are fewer ads than slots, the extra
   * slots render nothing — one ad is never repeated on the same page.
   */
  slotIndex?: number;
  /**
   * @deprecated No longer used — every ad renders full-width at its own
   * aspect ratio (never cropped). Kept so existing call sites keep compiling.
   */
  variant?: 'auto' | 'strip';
}

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

  const queryClient = useQueryClient();

  // Fetch advertisements for this position and current page
  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ['advertisements', position, currentPage, language],
    queryFn: async () => {
      // getAdvertisements already returns only ads matching this exact
      // position (backend-filtered). No client-side re-picking here.
      const ads = await getAdvertisements(position, currentPage, language, true);
      return ads;
    },
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Refresh immediately when an admin creates/updates/deletes an ad —
  // otherwise deleted ads keep showing (stale cache) and new ads never
  // appear until the cache expires. Listens on this document AND on other
  // tabs (via the localStorage 'storage' event).
  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADS_CHANGED_STORAGE_KEY) invalidate();
    };
    window.addEventListener('ads:changed', invalidate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('ads:changed', invalidate);
      window.removeEventListener('storage', onStorage);
    };
  }, [queryClient]);

  // Pick ONE stable ad per fetched list.
  // - Identical duplicates (same creative uploaded multiple times: same
  //   image + same target) collapse into ONE ad.
  // - One ad shows only ONCE per page: if there are fewer ads than slots,
  //   extra slots render nothing instead of repeating the same ad
  //   (previously `slotIndex % length` repeated it in every slot).
  const ad = useMemo(() => {
    if (!advertisements || advertisements.length === 0) return null;
    const seen = new Set<string>();
    const uniqueAds = advertisements.filter((a) => {
      const key = `${a.imageUrl}||${a.targetUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (slotIndex >= uniqueAds.length) return null;
    return uniqueAds[slotIndex];
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

  // Every ad fills its slot full-width at its OWN aspect ratio — exactly what
  // was uploaded (backend never crops anymore). No max-width caps, no fixed
  // heights, no object-cover: h-auto + w-full means zero cropping/stretching.
  return (
    <aside
      className={`advertisement w-full mx-auto flex flex-col items-center ${className}`}
      aria-label={`Advertisement: ${ad.title}`}
    >
      {/* Industry-standard micro label, like Google AdSense / real news sites */}
      <span className="mb-1 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gray-500">
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
          className="mx-auto block h-auto w-full border border-gray-200 bg-white hover:opacity-95 transition-opacity"
          onError={(e) => {
            // If the image fails to load, replace with fallback
            e.currentTarget.onerror = null; // Prevent infinite error loops
            e.currentTarget.src = getFallbackImageUrl(ad.position, ad.title);
          }}
        />
      </a>
    </aside>
  );
};

export default AdvertisementDisplay;
