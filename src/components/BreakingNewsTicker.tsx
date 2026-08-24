import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  slug: string;
}

const BreakingNewsTicker: React.FC = () => {
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch breaking news
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        setLoading(true);
        const response = await api.get('/news', { breaking: 'true' });

        if (response.success && response.data) {
          setBreakingNews(response.data);
        }
      } catch (err) {
        console.error('Error fetching breaking news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakingNews();

    // Refresh every 5 minutes
    const refreshInterval = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Rotate through breaking news every 5 seconds
  useEffect(() => {
    if (breakingNews.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % breakingNews.length);
    }, 5000);

    return () => clearInterval(rotationInterval);
  }, [breakingNews.length]);

  // If no breaking news, don't display anything
  if (loading || breakingNews.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white py-2 px-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0 flex items-center font-bold">
          <AlertCircle className="mr-2 h-4 w-4" />
          BREAKING:
        </div>
        <div className="whitespace-nowrap overflow-hidden relative flex-1">
          <div className="animate-marquee inline-block">
            {breakingNews.map((article, index) => (
              <Link
                key={article._id}
                to={`/article/${article.slug}`}
                className="mx-4 hover:underline"
                style={{ 
                  display: index === currentIndex ? 'inline-block' : 'none',
                  animation: 'fadeIn 0.5s' 
                }}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
