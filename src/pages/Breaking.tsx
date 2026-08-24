
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import SEO from "@/components/SEO";

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  image: string;
  author: { _id: string; name: string; avatar: string; };
  category: { _id: string; name: string; slug: string; };
  isBreaking: boolean;
  createdAt: string;
  updatedAt: string;
}

const Breaking = () => {
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        setLoading(true);
        const response = await api.get('/news', { breaking: 'true' });
        
        if (response.success && response.data) {
          setBreakingNews(response.data);
        } else {
          console.error('Failed to fetch breaking news:', response.message);
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching breaking news:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakingNews();
  }, []);
  
  // Format the timestamp to a relative time string
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };
  
  // Get image URL helper function
  const getImageUrl = (image: string) => {
    if (!image) return 'https://via.placeholder.com/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    
    // Handle relative paths
    const baseServerUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return image.startsWith('/') 
      ? `${baseServerUrl}${image}` 
      : `${baseServerUrl}/uploads/${image}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Breaking News"
        description="Live breaking news and top headlines - stay updated with the latest breaking news alerts from India and around the world on mibDaily News."
        url="/breaking"
        keywords={['breaking news', 'live news', 'headlines', 'breaking news today', 'mibdaily']}
      />
      <div className="flex items-center mb-6">
        <div className="h-5 w-5 rounded-full bg-red-600 animate-pulse mr-3"></div>
        <h1 className="text-3xl font-bold text-red-600">Breaking News</h1>
      </div>
      
      {loading ? (
        // Skeleton loading state
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="overflow-hidden border-l-4 border-gray-200">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <Skeleton className="h-full min-h-[150px] w-full" />
                </div>
                <CardContent className="p-4 md:w-2/3">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        // Error state
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading the breaking news. Please try again later.
          </AlertDescription>
        </Alert>
      ) : breakingNews.length === 0 ? (
        // Empty state
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No Breaking News</h3>
          <p className="text-gray-500">There are no breaking news articles at the moment. Please check back later.</p>
        </div>
      ) : (
        // Content state
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {breakingNews.map(article => (
            <Card key={article._id} className="overflow-hidden border-l-4 border-red-600">
              <Link to={`/article/${article.slug}`} className="flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <img 
                    src={getImageUrl(article.image)} 
                    alt={article.title} 
                    className="h-full w-full object-cover min-h-[150px]"
                  />
                </div>
                <CardContent className="p-4 md:w-2/3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive" className="text-xs">{article.category.name}</Badge>
                    <span className="text-xs text-gray-500">{formatTimeAgo(article.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Breaking;
