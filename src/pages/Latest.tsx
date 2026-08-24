
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import SEO from "@/components/SEO";
import { getImageUrl, extractTextFromHTML } from "@/lib/utils";

interface Article {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  image: string;
  author?: string | { _id: string; name: string };
  category?: string | { _id: string; name: string; slug: string };
  createdAt: string;
}

const Latest = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get('/news?sort=-createdAt&limit=12&page=1');
        if (response.success) {
          setArticles(response.data || []);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching latest news:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const getCategoryName = (category: any) => {
    if (typeof category === 'string') return 'General';
    return category?.name || 'General';
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMMM dd, yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Latest News"
        description="Get the latest news updates from India and around the world. Breaking news, top stories and live updates on mibDaily News."
        url="/latest"
        keywords={['latest news', 'breaking news', 'india news', 'top stories', 'mibdaily']}
      />
      <h1 className="text-3xl font-bold mb-6">Latest News</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-[200px] rounded-none" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">Unable to load the latest news right now.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((news) => (
            <Link key={news._id} to={`/article/${news.slug || news._id}`}>
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                <img
                  src={getImageUrl(news.image)}
                  alt={news.title}
                  className="w-full h-[200px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{getCategoryName(news.category)}</Badge>
                    <span className="text-xs text-gray-500">{formatTime(news.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-lg line-clamp-2">{extractTextFromHTML(news.title)}</h3>
                  {news.summary && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{extractTextFromHTML(news.summary)}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Latest;
