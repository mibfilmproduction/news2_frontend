import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { transformInstagramToReel } from '@/lib/instagram-api';
import { api } from '@/lib/api-client';
import { Loader2, Instagram, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';

interface InstagramReelsProps {
  limit?: number;
  showViewMore?: boolean;
}

const InstagramReels: React.FC<InstagramReelsProps> = ({ 
  limit = 6,
  showViewMore = true
}) => {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [after, setAfter] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  
  // Sample data for demonstration when token is invalid
  const sampleInstagramReels = [
    {
      _id: 'instagram_sample1',
      title: 'Breaking News Update',
      description: 'Latest updates on the developing story. Follow for more details as they emerge. #BreakingNews #Update',
      videoUrl: 'https://example.com/video1.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1585399000684-d2f72660f092?q=80&w=1000',
      externalUrl: 'https://www.instagram.com/reel/sample1/',
      author: { _id: 'instagram', name: 'mibnews' },
      isExternal: true,
      platform: 'instagram',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1542,
      likes: 348,
      comments: 27,
      isActive: true,
      isFeatured: true,
      tags: ['news', 'breaking']
    },
    {
      _id: 'instagram_sample2',
      title: 'Sports Highlights',
      description: 'Check out the best moments from yesterday\'s game! What an incredible match! #Sports #Highlights',
      videoUrl: 'https://example.com/video2.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1000',
      externalUrl: 'https://www.instagram.com/reel/sample2/',
      author: { _id: 'instagram', name: 'mibnews' },
      isExternal: true,
      platform: 'instagram',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      views: 3215,
      likes: 892,
      comments: 54,
      isActive: true,
      isFeatured: false,
      tags: ['sports', 'highlights']
    },
    {
      _id: 'instagram_sample3',
      title: 'Tech Review',
      description: 'Reviewing the latest smartphone release. Is it worth the upgrade? #Tech #Review #Smartphone',
      videoUrl: 'https://example.com/video3.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000',
      externalUrl: 'https://www.instagram.com/reel/sample3/',
      author: { _id: 'instagram', name: 'mibnews' },
      isExternal: true,
      platform: 'instagram',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      views: 2184,
      likes: 456,
      comments: 38,
      isActive: true,
      isFeatured: false,
      tags: ['tech', 'review']
    }
  ];

  // Fetch Instagram Reels
  useEffect(() => {
    loadInstagramReels();
  }, []);
  
  const loadInstagramReels = async () => {
    try {
      setLoading(true);
      
      // Tokens remain on the backend; the browser only calls our API.
      const response = await api.get('/instagram/reels', { limit, after }, { requireAuth: false });
      
      if (response.success && response.data) {
        // Transform Instagram media to match our application format
        const transformedReels = response.data.map(transformInstagramToReel);
        
        // If loading more, append to existing reels
        setReels(after ? [...reels, ...transformedReels] : transformedReels);
        
        // Update pagination state
        setAfter(response.pagination?.cursors?.after);
        setHasMore(!!response.pagination?.hasNextPage);
      } else {
        // Fall back to sample data on error
        setError(response.message || 'Failed to load Instagram reels');
        setReels([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading Instagram reels:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMoreReels = () => {
    if (hasMore && !loading) {
      loadInstagramReels();
    }
  };
  
  // Render error state
  if (error && !loading && reels.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setError(null);
            loadInstagramReels();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Section header with Instagram branding */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Instagram className="h-5 w-5 text-pink-500" />
          <h3 className="text-xl font-bold">Instagram Reels</h3>
        </div>
        
        {reels.length > 0 && showViewMore && (
          <Button variant="ghost" size="sm" asChild>
            <a 
              href="https://www.instagram.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1"
            >
              <span>View More</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
      
      {/* Loading state */}
      {loading && reels.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Reels grid */}
      {reels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reels.map((reel) => (
            <Card key={reel._id} className="overflow-hidden">
              <div className="aspect-video relative">
                <a 
                  href={reel.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  {/* Thumbnail */}
                  <img 
                    src={reel.thumbnail || 'https://via.placeholder.com/640x360?text=Instagram+Reel'} 
                    alt={reel.title}
                    className="object-cover w-full h-full"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all">
                    <div className="rounded-full bg-white/90 p-3">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-6 h-6 text-pink-500"
                      >
                        <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Instagram badge */}
                  <Badge variant="secondary" className="absolute top-2 right-2 flex items-center space-x-1">
                    <Instagram className="h-3 w-3" />
                    <span>Instagram</span>
                  </Badge>
                </a>
              </div>
              
              <CardContent className="p-4">
                <h4 className="font-medium line-clamp-1">{reel.title}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reel.description}</p>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between text-sm text-gray-500">
                <span>@{reel.author.name}</span>
                <span>{new Date(reel.createdAt).toLocaleDateString()}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Load more button */}
      {reels.length > 0 && hasMore && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={loadMoreReels}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InstagramReels;
