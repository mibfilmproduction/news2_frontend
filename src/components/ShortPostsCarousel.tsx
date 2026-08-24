import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { MessageSquare, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
// Properly import and instantiate Autoplay
import AutoplayPlugin from "embla-carousel-autoplay";

interface ShortPost {
  _id: string;
  content: string;
  image?: string;
  author: {
    _id: string;
    name: string;
  } | string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

interface ShortPostsCarouselProps {
  limit?: number;
  showViewMore?: boolean;
  tag?: string;
}

const ShortPostsCarousel: React.FC<ShortPostsCarouselProps> = ({ 
  limit = 6, 
  showViewMore = true,
  tag
}) => {
  const [posts, setPosts] = useState<ShortPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  
  // Track carousel index changes
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.on("select", () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);
  
  // Add keyboard navigation support
  useEffect(() => {
    if (!carouselApi) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        carouselApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        carouselApi.scrollNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselApi]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        
        if (tag) {
          params.append('tag', tag);
        }
        
        const response = await api.get(`/short-posts?${params.toString()}`);
        
        if (response.success && response.data) {
          setPosts(response.data);
        } else {
          setError(response.message || 'Failed to fetch short posts');
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch short posts',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error fetching short posts:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [limit, tag, toast]);

  // Format timestamp to "time ago" format
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };
  
  // Handle like functionality
  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await api.post(`/short-posts/${id}/like`);
      
      if (response.success) {
        // Update likes count in the state
        setPosts(posts.map(post => 
          post._id === id ? { ...post, likes: post.likes + 1 } : post
        ));
      }
    } catch (err) {
      console.error('Error liking post:', err);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle share functionality
  const handleShare = async (post: ShortPost, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `Short Post by ${typeof post.author === 'object' ? post.author.name : 'Unknown'}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: `${window.location.origin}/short-posts/${post._id}`,
        });
        
        // Update shares count in the state
        setPosts(posts.map(p => 
          p._id === post._id ? { ...p, shares: p.shares + 1 } : p
        ));
        
        // Also update on server
        await api.post(`/short-posts/${post._id}/share`);
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(`${window.location.origin}/short-posts/${post._id}`);
        
        toast({
          title: "Link Copied!",
          description: "Post link copied to clipboard.",
        });
        
        // Update shares count in the state
        setPosts(posts.map(p => 
          p._id === post._id ? { ...p, shares: p.shares + 1 } : p
        ));
        
        // Also update on server
        await api.post(`/short-posts/${post._id}/share`);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };
  
  // Get author name helper function
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown';
    return author?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Short Posts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Short Posts</h2>
        
        {showViewMore && (
          <Link to="/short-posts">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        )}
      </div>
      
      <div className="relative group">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1,
            containScroll: "trimSnaps"
          }}
          plugins={[
            AutoplayPlugin({ delay: 5000, stopOnInteraction: false })
          ]}
          className="w-full"
          setApi={setCarouselApi}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {posts.map((post) => (
              <CarouselItem 
                key={post._id} 
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
              >
                <div className="border rounded-lg p-4 h-full flex flex-col hover:shadow-md transition-shadow duration-300 bg-white relative cursor-pointer">
                  {/* View Full Post button in the top right */}
                  <div className="absolute top-2 right-2 z-10">
                    <Link to={`/short-posts/${post._id}`} className="no-underline">
                      <Badge variant="outline" className="hover:bg-primary hover:text-white transition-colors cursor-pointer">
                        View Full Post
                      </Badge>
                    </Link>
                  </div>
                  
                  <Link to={`/short-posts/${post._id}`} className="flex-grow no-underline text-inherit">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {getAuthorName(post.author).charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{getAuthorName(post.author)}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="line-clamp-3">{post.content}</p>
                      {post.content.length > 150 && (
                        <span className="text-primary text-sm hover:underline">
                          Read more
                        </span>
                      )}
                    </div>
                    
                    {post.image && (
                      <div className="mb-3 rounded-md overflow-hidden">
                        <img
                          src={getImageUrl(post.image)}
                          alt="Post content"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex justify-between text-gray-500 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center space-x-1 px-2"
                      onClick={(e) => handleLike(post._id, e)}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </Button>
                    
                    <Link to={`/short-posts/${post._id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center space-x-1 px-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center space-x-1 px-2"
                      onClick={(e) => handleShare(post, e)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{post.shares}</span>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Interactive navigation dots */}
          <div className="flex justify-center mt-4">
            {Array.from({ length: Math.ceil(posts.length / 4) }).map((_, index) => (
              <button
                key={index}
                className={`mx-1 h-2 w-2 rounded-full ${index === currentIndex ? 'bg-primary' : 'bg-gray-300'} transition-colors duration-300`}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => carouselApi?.scrollTo(index)}
              />
            ))}
          </div>
          
          {/* Previous/Next buttons that appear on hover */}
          <button
            onClick={() => carouselApi?.scrollPrev()}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full p-2 bg-white/80 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 text-gray-800" />
          </button>
          
          <button
            onClick={() => carouselApi?.scrollNext()}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full p-2 bg-white/80 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 text-gray-800" />
          </button>
        </Carousel>
      </div>
    </div>
  );
};

export default ShortPostsCarousel;
