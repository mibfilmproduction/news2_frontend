import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Play, Pause, Volume2, VolumeX, MessageSquare, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import AutoplayPlugin from "embla-carousel-autoplay";

interface Reel {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  author: {
    _id: string;
    name: string;
  } | string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  tags: string[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReelsCarouselProps {
  featured?: boolean;
  limit?: number;
  showViewMore?: boolean;
  category?: string;
}

const ReelsCarousel: React.FC<ReelsCarouselProps> = ({
  featured = false,
  limit = 6,
  showViewMore = true,
  category,
}) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReel, setActiveReel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
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
    const fetchReels = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        
        if (featured) {
          params.append('featured', 'true');
        }
        
        if (category) {
          params.append('category', category);
        }
        
        const response = await api.get(`/reels?${params.toString()}`);
        
        if (response.success && response.data) {
          setReels(response.data);
        } else {
          setError(response.message || 'Failed to fetch reels');
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch reels',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error fetching reels:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, [featured, limit, category, toast]);

  // Handle video playback
  const togglePlayback = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const videoElement = videoRefs.current[reelId];
    
    if (!videoElement) return;
    
    if (activeReel === reelId) {
      // Toggle play/pause on the active reel
      if (videoElement.paused) {
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
        });
      } else {
        videoElement.pause();
      }
    } else {
      // Stop any currently playing video
      if (activeReel && videoRefs.current[activeReel]) {
        videoRefs.current[activeReel].pause();
      }
      
      // Play the new video
      setActiveReel(reelId);
      videoElement.currentTime = 0;
      videoElement.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  };
  
  // Handle like functionality
  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/reels/${id}/like`);
      
      if (response.success) {
        // Update likes count in the state
        setReels(reels.map(reel => 
          reel._id === id ? { ...reel, likes: reel.likes + 1 } : reel
        ));
      }
    } catch (err) {
      console.error('Error liking reel:', err);
      toast({
        title: "Error",
        description: "Failed to like reel. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle mute status
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    
    // Apply the mute status to all videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  // Format duration (seconds) to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Get author name helper function
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown';
    return author?.name || 'Unknown';
  };

  // Get category name helper function
  const getCategoryName = (category: any) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return 'Unknown';
    return category?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{featured ? 'Featured Reels' : 'Video Reels'}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                <div className="flex justify-between pt-2">
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && reels.length === 0) {
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
        <h2 className="text-2xl font-bold">{featured ? 'Featured Reels' : 'Video Reels'}</h2>
        
        {showViewMore && (
          <Link to="/reels">
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
            {reels.map((reel) => (
              <CarouselItem 
                key={reel._id} 
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
              >
                <div className="border rounded-lg overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300 bg-white">
                  <div 
                    className="relative aspect-[9/16] cursor-pointer"
                    onClick={(e) => togglePlayback(reel._id, e)}
                  >
                    {/* Thumbnail with play button overlay */}
                    <img
                      src={reel.thumbnail ? getImageUrl(reel.thumbnail) : `https://via.placeholder.com/640x360?text=Video`}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Video element (hidden until played) */}
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current[reel._id] = el;
                      }}
                      src={reel.videoUrl}
                      poster={reel.thumbnail ? getImageUrl(reel.thumbnail) : undefined}
                      muted={isMuted}
                      playsInline
                      loop
                      className={`absolute inset-0 w-full h-full object-cover ${activeReel === reel._id ? '' : 'hidden'}`}
                    />
                    
                    {/* Play/pause overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all">
                      {activeReel === reel._id && !videoRefs.current[reel._id]?.paused ? (
                        <div className="rounded-full bg-white/80 p-3">
                          <Pause className="h-6 w-6 text-primary" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-white/80 p-3">
                          <Play className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* Mute/unmute button */}
                    <button
                      className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 text-white"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    
                    {/* Duration badge */}
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(reel.duration)}
                    </span>
                    
                    {/* Category badge if exists */}
                    {reel.category && (
                      <Badge 
                        className="absolute top-2 left-2" 
                        variant={reel.featured ? "default" : "secondary"}
                      >
                        {getCategoryName(reel.category)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-medium mb-1 line-clamp-1">{reel.title}</h3>
                    
                    {reel.description && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {reel.description}
                        </p>
                        {reel.description.length > 100 && (
                          <Link to={`/reels/${reel._id}`} className="text-primary text-xs hover:underline">
                            Read more
                          </Link>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center space-x-1 px-2"
                        onClick={(e) => handleLike(reel._id, e)}
                      >
                        <Heart className="h-4 w-4" />
                        <span>{reel.likes}</span>
                      </Button>
                      
                      <Link to={`/reels/${reel._id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 px-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{reel.comments}</span>
                        </Button>
                      </Link>
                      
                      <span className="text-xs">{formatTimeAgo(reel.createdAt)}</span>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <Link 
                        to={`/reels/${reel._id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Reel
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Interactive navigation dots */}
          <div className="flex justify-center mt-4">
            {Array.from({ length: Math.ceil(reels.length / 4) }).map((_, index) => (
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

export default ReelsCarousel;
