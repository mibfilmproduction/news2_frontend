import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAdvertisements, trackAdImpression, trackAdClick, Advertisement } from '../services/advertisementService';
import { Loader2, AlertCircle } from 'lucide-react';
import { useApiQuery } from '../lib/react-query';
import { useLanguage } from './LanguageSwitcher';
import { BreakingNewsSkeleton } from './ui/skeletons';
import { logError } from '../lib/sentry';
import analytics from '../lib/analytics';
import { api } from '@/lib/api-client';

// Function to check if an image URL is valid and safe to use
const isValidImageUrl = (url?: string): boolean => {
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
    console.warn('Blob URL detected and rejected:', url);
    return false;
  }
  
  // For any other format, reject as potentially unsafe
  return false;
};

// Generate a fallback image if the ad image is invalid
const getFallbackImageUrl = (position?: string, title?: string): string => {
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

const BreakingNews = () => {
  const { language } = useLanguage();
  
  // State for breaking news articles
  const [breakingArticles, setBreakingArticles] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<Error | null>(null);
  
  // Fetch breaking news articles
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        // Track the request start time for performance monitoring
        const startTime = performance.now();
        setNewsLoading(true);
        
        // Fetch breaking news articles using the main API
        const response = await api.get('/news', { breaking: 'true' });
        
        // Track timing for analytics
        const duration = performance.now() - startTime;
        analytics.timing('api', 'fetch_breaking_news', duration);
        
        if (response.success && response.data) {
          setBreakingArticles(response.data);
        } else {
          throw new Error('Failed to fetch breaking news');
        }
      } catch (error) {
        console.error('Error fetching breaking news:', error);
        setNewsError(error as Error);
        // Log error to Sentry
        logError(error as Error, { component: 'BreakingNews', operation: 'fetchNews' });
      } finally {
        setNewsLoading(false);
      }
    };
    
    fetchBreakingNews();
    
    // Refresh breaking news every 5 minutes
    const refreshInterval = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [language]);
  
  // Fetch advertisement with React Query
  const {
    data: adsData,
    isLoading: adLoading,
    error: adError
  } = useApiQuery<Advertisement[]>(
    ['advertisements', 'breaking-news', 'home', language],
    async () => {
      try {
        const startTime = performance.now();
        console.log('BreakingNews: Fetching advertisements for breaking-news position');
        
        // Force refresh to ensure we get fresh data from the server
        const ads = await getAdvertisements('breaking-news', 'home', language, true);
        
        // Track timing for analytics
        const duration = performance.now() - startTime;
        analytics.timing('api', 'fetch_advertisements', duration);
        
        console.log('BreakingNews: Advertisement fetch result:', ads);
        
        // Track ad impression if ads are available
        if (ads && ads.length > 0) {
          console.log(`BreakingNews: Found ${ads.length} advertisements to display`);
          // We'll track the impression when rendered in the component
        } else {
          console.warn('BreakingNews: No advertisements found, check database or filters');
        }
        
        return ads;
      } catch (error) {
        // Log error to Sentry
        logError(error as Error, { component: 'BreakingNews', operation: 'fetchAds' });
        throw error;
      }
    },
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
      retry: 1
    }
  );
  
  // Select a random ad if multiple are available
  const advertisement = React.useMemo(() => {
    if (adsData && adsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * adsData.length);
      return adsData[randomIndex];
    }
    return null;
  }, [adsData]);
  
  // Track ad impression when advertisement is loaded
  React.useEffect(() => {
    if (advertisement) {
      trackAdImpression(advertisement._id);
    }
  }, [advertisement]);
  
  // Handle ad click
  const handleAdClick = (adId: string, targetUrl: string) => {
    // Track the click via API
    trackAdClick(adId);
    
    // Track the click in analytics
    analytics.event({
      category: 'Advertisement',
      action: 'click',
      label: adId
    });
    
    // Open the ad URL in a new tab
    window.open(targetUrl, '_blank');
  };
  
  // Custom CSS for marquee animation if not defined in your global styles
  useEffect(() => {
    // Add the marquee animation styles if needed
    const styleSheet = document.styleSheets[0];
    const keyframesRule = `@keyframes marquee { 
      0% { transform: translateX(0); } 
      100% { transform: translateX(-100%); }
    }`;
    const animationRule = `.animate-news-marquee { 
      animation: marquee 30s linear infinite;
    }`;
    
    // Only add if they don't exist
    try {
      if (!document.querySelector('style#marquee-animation')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'marquee-animation';
        styleElement.textContent = keyframesRule + animationRule;
        document.head.appendChild(styleElement);
      }
    } catch (error) {
      console.error('Error adding marquee animation styles:', error);
    }
  }, []);

  return (
    <>
      <div className="bg-gray-100 py-2 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-start sm:items-center sm:justify-center justify-center ">
            
            <div className="bg-primary text-white font-semibold px-3 py-1 mb-2 sm:mb-0 whitespace-nowrap rounded">
              ताजा खबर
            </div>

            <div className="overflow-hidden w-full sm:flex-1 sm:ml-4">
              {newsLoading ? (
                <div className="flex items-center justify-center h-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">{language === 'hindi' ? 'समाचार लोड हो रहा है...' : 'Loading news...'}</span>
                </div>
              ) : newsError ? (
                <div className="flex items-center text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>{language === 'hindi' ? 'समाचार लोड करने में त्रुटि' : 'Unable to load breaking news'}</span>
                </div>
              ) : breakingArticles.length === 0 ? (
                <div className="text-sm text-gray-500">
                  {language === 'hindi' ? 'इस समय कोई ताजा खबर नहीं है' : 'No breaking news at this time'}
                </div>
              ) : (
                <div className="flex space-x-8 sm:space-x-16 animate-news-marquee hover:pause">
                  {breakingArticles.map((article) => (
                    <Link 
                      key={article._id} 
                      to={`/article/${article.slug}`}
                      className="text-sm font-medium whitespace-nowrap hover:text-primary transition-colors duration-200"
                      onClick={() => analytics.event({
                        category: 'BreakingNews',
                        action: 'click',
                        label: article._id
                      })}
                    >
                      {article.title}
                    </Link>
                  ))}
                  {/* Duplicate items to create a seamless loop */}
                  {breakingArticles.map((article) => (
                    <Link 
                      key={`repeat-${article._id}`} 
                      to={`/article/${article.slug}`}
                      className="text-sm font-medium whitespace-nowrap hover:text-primary transition-colors duration-200"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full-width Advertisement Space */}
      <div className="w-full bg-gray-200 py-4 border-b border-gray-300">
        <div className="container mx-auto px-4">
          {adLoading ? (
            <div className="flex justify-center items-center h-24 border border-gray-300 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : adError ? (
            <div className="flex justify-center items-center h-24 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-gray-500 text-sm">Advertisement Unavailable</span>
            </div>
          ) : advertisement ? (
            <div 
              className="flex justify-center items-center h-24 border border-gray-300 rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleAdClick(advertisement._id, advertisement.targetUrl)}
              role="banner"
              aria-label={`Advertisement: ${advertisement.title}`}
            >
              <div className="text-gray-400 text-center w-full relative">
                <img 
                  src={isValidImageUrl(advertisement.imageUrl) ? 
                    advertisement.imageUrl : 
                    getFallbackImageUrl(advertisement.position, advertisement.title)}
                  alt={advertisement.title} 
                  className="max-w-full h-auto object-contain mx-auto" 
                  style={{ maxHeight: '90px' }} 
                  loading="lazy"
                  onError={(e) => {
                    console.log(`BreakingNews: Image error for ad: ${advertisement.title}`);
                    e.currentTarget.onerror = null; // Prevent infinite error loops
                    e.currentTarget.src = getFallbackImageUrl(advertisement.position, advertisement.title);
                  }}
                />
                <span className="absolute top-0 right-0 bg-gray-700 text-white text-xs px-1 opacity-70">
                  {language === 'hindi' ? 'विज्ञापन' : 'Ad'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-24 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-gray-500 text-sm">
                {language === 'hindi' ? 'विज्ञापन स्थान' : 'Advertisement Space'}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BreakingNews;
