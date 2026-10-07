import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import SEO from "@/components/SEO";
import { getImageUrl, extractTextFromHTML } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageSwitcher";
import { cityLabel, stateLabel } from "@/lib/cities";

interface Article {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  image: string;
  city?: string;
  state?: string;
  author?: string | { _id: string; name: string };
  category?: string | { _id: string; name: string; slug: string };
  createdAt: string;
}

const PAGE_SIZE = 12;

const GeoNews: React.FC<{ mode: 'city' | 'state' }> = ({ mode }) => {
  const params = useParams();
  const { language } = useLanguage();
  const hindi = language === 'hindi';
  const name = decodeURIComponent(params.cityName || params.stateName || '');

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = async (pageNum: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(false);
      }
      const filter =
        mode === 'city'
          ? `&city=${encodeURIComponent(name)}`
          : `&state=${encodeURIComponent(name)}`;
      const response = await api.get(
        `/news?sort=-createdAt&limit=${PAGE_SIZE}&page=${pageNum}${filter}`
      );
      if (response.success) {
        const list: Article[] = response.data || [];
        setArticles((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= PAGE_SIZE);
        setPage(pageNum);
      } else {
        if (!append) setError(true);
      }
    } catch (err) {
      console.error('Error fetching geo news:', err);
      if (!append) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    if (name) fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, mode]);

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

  const title = mode === 'city'
    ? (hindi ? `${name} की खबरें` : `${name} News`)
    : (hindi ? `${name} राज्य की खबरें` : `${name} State News`);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={title}
        description={hindi ? `${name} से जुड़ी ताज़ा खबरें` : `Latest news from ${name}`}
        url={mode === 'city' ? `/city/${encodeURIComponent(name)}` : `/state/${encodeURIComponent(name)}`}
        keywords={[name, 'local news', 'city news', 'mibnews']}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="text-sm text-gray-500">
            {mode === 'city'
              ? (hindi ? `शहर: ${cityLabel(name)}` : `City: ${cityLabel(name)}`)
              : (hindi ? `राज्य: ${stateLabel(name)}` : `State: ${stateLabel(name)}`)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-[200px] w-full rounded-none" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="mb-2 h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-gray-500">
            {hindi ? "खबरें लोड नहीं हो पाईं।" : "Unable to load news right now."}
          </p>
          <button onClick={() => fetchPage(1, false)} className="text-primary underline">
            {hindi ? "पुनः प्रयास करें" : "Retry"}
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-lg text-gray-500">
            {hindi
              ? `${name} के लिए अभी कोई खबर नहीं है।`
              : `No news yet for ${name}.`}
          </p>
          <Link to="/latest" className="mt-4 inline-block text-primary underline">
            {hindi ? "ताज़ा खबरें देखें" : "View latest news"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((news) => (
              <Link key={news._id} to={`/article/${news.slug || news._id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <img
                    src={getImageUrl(news.image)}
                    alt={news.title}
                    className="h-[200px] w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{getCategoryName(news.category)}</Badge>
                        {news.city && news.city !== 'all' && (
                          <Badge variant="secondary" className="text-xs">{cityLabel(news.city)}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatTime(news.createdAt)}</span>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold">{extractTextFromHTML(news.title)}</h3>
                    {news.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{extractTextFromHTML(news.summary)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchPage(page + 1, true)}
                disabled={loadingMore}
                className="rounded-full border border-gray-300 px-6 py-2 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {loadingMore
                  ? (hindi ? "लोड हो रहा है..." : "Loading...")
                  : (hindi ? "और खबरें देखें" : "Load more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GeoNews;
