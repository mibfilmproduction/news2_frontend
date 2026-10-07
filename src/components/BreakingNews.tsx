import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageSwitcher';
import { logError } from '../lib/sentry';
import analytics from '../lib/analytics';
import { api } from '@/lib/api-client';

const BreakingNews = () => {
  const { language } = useLanguage();
  const [breakingArticles, setBreakingArticles] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const startTime = performance.now();
        setNewsLoading(true);
        const response = await api.get('/news', { breaking: 'true' });
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
        logError(error as Error, { component: 'BreakingNews', operation: 'fetchNews' });
      } finally {
        setNewsLoading(false);
      }
    };
    fetchBreakingNews();
    const refreshInterval = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [language]);

  useEffect(() => {
    try {
      if (!document.querySelector('style#marquee-animation')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'marquee-animation';
        styleElement.textContent = `@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.animate-news-marquee{display:flex;width:max-content;align-items:center;animation:marquee 30s linear infinite}`;
        document.head.appendChild(styleElement);
      }
    } catch (error) {
      console.error('Error adding marquee animation styles:', error);
    }
  }, []);

  const renderItem = (article: any, extra?: { hidden?: boolean }) => (
    <Link
      key={extra?.hidden ? `repeat-${article._id}` : article._id}
      to={`/article/${article.slug}`}
      aria-hidden={extra?.hidden || undefined}
      tabIndex={extra?.hidden ? -1 : undefined}
      className="whitespace-nowrap text-sm font-medium transition-colors duration-200 hover:text-primary"
      onClick={extra?.hidden ? undefined : () => analytics.event({ category: 'BreakingNews', action: 'click', label: article._id })}
    >
      {article.title}
    </Link>
  );

  return (
    <div className="border-b border-t border-gray-200 bg-gray-100 py-1 sm:py-1.5">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-sm font-semibold text-white sm:px-3 sm:text-base">
            ताजा खबर
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {newsLoading ? (
              <div className="flex h-6 items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="truncate text-sm">{language === 'hindi' ? 'समाचार लोड हो रहा है...' : 'Loading news...'}</span>
              </div>
            ) : newsError ? (
              <div className="flex h-6 items-center text-sm text-red-500">
                <AlertCircle className="mr-1 h-4 w-4 shrink-0" />
                <span className="truncate">{language === 'hindi' ? 'समाचार लोड करने में त्रुटि' : 'Unable to load breaking news'}</span>
              </div>
            ) : breakingArticles.length === 0 ? (
              <div className="flex h-6 items-center text-sm text-gray-500">
                <span className="truncate">{language === 'hindi' ? 'इस समय कोई ताजा खबर नहीं है' : 'No breaking news at this time'}</span>
              </div>
            ) : (
              <div className="animate-news-marquee gap-8 py-0.5 pr-8 hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
                {breakingArticles.map((a) => renderItem(a))}
                {breakingArticles.map((a) => renderItem(a, { hidden: true }))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNews;
