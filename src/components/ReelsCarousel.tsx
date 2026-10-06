import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useLikes } from '@/hooks/useLikes';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Play, Pause, Volume2, VolumeX, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
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
  isLiked?: boolean;
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
  const navigate = useNavigate();
  const { isLiked, toggleLike, seedFromServer } = useLikes('reels');

  // Sync server liked flags
  useEffect(() => {
    if (reels.length) seedFromServer(reels);
  }, [reels, seedFromServer]);
  
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
  
  // Handle like toggle — one user one like, red fill when liked
  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reel = reels.find((r) => r._id === id);
    const result = await toggleLike(id, reel?.likes ?? 0);
    if (!result.ok && result.reason === 'login') {
      toast({ title: 'Login required', description: 'Please login to like reels.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (!result.ok) {
      toast({ title: 'Error', description: 'Failed to like reel. Please try again.', variant: 'destructive' });
      return;
    }
    setReels((prev) => prev.map((r) => (r._id === id ? { ...r, likes: result.likes, isLiked: result.liked } : r)));
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
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold">{featured ? 'Featured Reels' : 'Video Reels'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(Math.min(limit, 6))].map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden bg-black">
              <div className="h-14 bg-red-700 animate-pulse" />
              <div className="h-32 bg-gray-800 animate-pulse" />
              <div className="h-12 bg-black animate-pulse" />
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
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
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
                className="pl-2 md:pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
              >
                {/* Compact card: FULL image with all text overlaid on top */}
                <div className="rounded-lg overflow-hidden h-full flex flex-col bg-black border border-black hover:shadow-md transition-shadow duration-300">
                  <div
                    className="relative aspect-[9/14] cursor-pointer overflow-hidden"
                    onClick={(e) => togglePlayback(reel._id, e)}
                  >
                    {/* Thumbnail with play button overlay */}
                    <img
                      src={reel.thumbnail ? getImageUrl(reel.thumbnail) : `https://via.placeholder.com/640x360?text=Video`}
                      alt={reel.title}
                      className="absolute inset-0 w-full h-full object-cover bg-gray-900"
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
                    
                    {/* Center play button (red circle like reference) + bottom title overlay */}
                    <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
                      {activeReel === reel._id && !videoRefs.current[reel._id]?.paused ? (
                        <div className="rounded-full bg-red-600 p-2 shadow-lg">
                          <Pause className="h-4 w-4 text-white fill-white" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-600 p-2 shadow-lg">
                          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                        </div>
                      )}
                    </div>
                    {/* Bottom gradient + title text over the video */}
                    <div className="absolute bottom-0 left-0 right-0 z-[2] bg-gradient-to-t from-black via-black/85 to-transparent px-2 pt-10 pb-2 pointer-events-none">
                      <h3 className="text-white text-[13px] font-bold leading-snug line-clamp-3 drop-shadow-md" title={reel.title}>
                        {reel.title}
                      </h3>
                      <p className="text-gray-300 text-[10px] leading-tight mt-0.5 flex items-center gap-1">
                        <span
                          className="flex items-center gap-1 pointer-events-auto relative z-10 cursor-pointer"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(reel._id, e); }}
                        >
                          <Heart className={`h-2.5 w-2.5 ${isLiked(reel._id, reel.isLiked) ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{reel.likes}</span>
                        </span>
                        <span>•</span>
                        <span>{reel.views} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(reel.createdAt)}</span>
                      </p>
                    </div>

                    {/* Mute/unmute button */}
                    <button
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 text-white"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMute(e); }}
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>

                    {/* Duration badge */}
                    <span className="absolute top-2 left-2 z-[2] bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {formatDuration(reel.duration)}
                    </span>

                    {/* Full-card click -> detail page */}
                    <Link
                      to={`/reels/${reel._id}`}
                      className="absolute inset-0"
                      aria-label={reel.title}
                      onClick={(e) => { if (activeReel === reel._id) e.preventDefault(); }}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Interactive navigation dots */}
          <div className="flex justify-center mt-1.5">
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
