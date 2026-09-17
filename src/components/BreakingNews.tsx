import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageSwitcher';
import { logError } from '../lib/sentry';
import analytics from '../lib/analytics';
import { api } from '@/lib/api-client';

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
  );
};

export default BreakingNews;
