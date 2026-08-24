import React, { useState, useEffect, useRef } from 'react';
import SEO from '@/components/SEO';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Pause, Volume2, VolumeX, MessageSquare, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

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

const ReelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReels, setTotalReels] = useState(0); // Added missing state for total reels count
  const [isLoading, setIsLoading] = useState(true);
  const [reels, setReels] = useState<Reel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const activeTab = searchParams.get('tab') || 'latest';
  const selectedCategory = searchParams.get('category') || '';
  const [activeReel, setActiveReel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const { toast } = useToast();
  const REELS_PER_PAGE = 9;

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories?active=true');
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch reels with pagination and filters
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current filter params
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        params.set('limit', REELS_PER_PAGE.toString());
        
        if (selectedCategory && selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        } else {
          params.delete('category');
        }
        
        // Use direct fetch for better error handling
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels?${params.toString()}`;
        console.log('Fetching reels from:', apiUrl);
        
        try {
          const response = await fetch(apiUrl);
          
          console.log('API response status:', response.status);
          
          if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          // Parse response data
          let data;
          try {
            data = await response.json();
            console.log('Reels data received:', data);
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            throw new Error('Failed to parse server response. Invalid JSON format.');
          }
          
          // Process the data
          if (!data) {
            // Handle empty response
            console.warn('Empty data received from API');
            setReels([]);
            setTotalPages(1);
            setTotalReels(0);
            return;
          }
          
          if (data.success === false) {
            // API explicitly indicated an error
            console.error('API returned error:', data.message);
            throw new Error(data.message || 'Failed to fetch reels');
          }
          
          // Handle different response formats
          try {
            // Case 1: Direct array in data.data
            if (data.data && Array.isArray(data.data)) {
              console.log('Handling array response format');
              setReels(data.data);
              const dataLength = data.data.length;
              setTotalPages(Math.ceil(dataLength / REELS_PER_PAGE));
              setTotalReels(dataLength);
              return;
            }
            
            // Case 2: Object with reels array and pagination
            if (data.data && typeof data.data === 'object' && 'reels' in data.data) {
              const reelsArray = data.data.reels;
              if (Array.isArray(reelsArray)) {
                console.log('Handling object with reels array format');
                setReels(reelsArray);
                
                // Safely access pagination data
                const pagination = data.data.pagination || {};
                const totalPages = typeof pagination.totalPages === 'number' ? pagination.totalPages : 1;
                const totalItems = typeof pagination.totalItems === 'number' ? pagination.totalItems : reelsArray.length;
                
                setTotalPages(totalPages);
                setTotalReels(totalItems);
                return;
              }
            }
            
            // Case 3: Direct reels property at top level
            if (data.reels && Array.isArray(data.reels)) {
              console.log('Handling top-level reels array format');
              setReels(data.reels);
              const reelsLength = data.reels.length;
              setTotalPages(Math.ceil(reelsLength / REELS_PER_PAGE));
              setTotalReels(reelsLength);
              return;
            }
            
            // Case 4: Try to adapt to any other format
            console.warn('Unexpected response format, trying to adapt', data);
            
            // Last attempt to find anything usable
            let reelsArray = [];
            
            // Check for arrays at any level
            if (data.data && Array.isArray(data.data)) {
              reelsArray = data.data;
            } else if (data.reels && Array.isArray(data.reels)) {
              reelsArray = data.reels;
            } else if (data.data && typeof data.data === 'object' && 'reels' in data.data && Array.isArray(data.data.reels)) {
              reelsArray = data.data.reels;
            } else if (Array.isArray(data)) {
              // Maybe the whole response is an array
              reelsArray = data;
            }
            
            console.log('Extracted reels array:', reelsArray);
            setReels(reelsArray);
            const arrayLength = reelsArray.length;
            setTotalPages(Math.max(1, Math.ceil(arrayLength / REELS_PER_PAGE)));
            setTotalReels(arrayLength);
          } catch (dataError) {
            console.error('Error processing response data:', dataError);
            throw new Error('Failed to process response data');
          }
        } catch (fetchError) {
          console.error('Error fetching data:', fetchError);
          let errorMsg = 'Failed to fetch reels. Please try again later.';
          if (fetchError instanceof Error) {
            errorMsg = fetchError.message || errorMsg;
          }
          setError(errorMsg);
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      } catch (outerError) {
        console.error('Error in fetchReels:', outerError);
        let errorMsg = 'An unexpected error occurred. Please try again.';
        if (outerError instanceof Error) {
          errorMsg = outerError.message || errorMsg;
        }
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReels();
  }, [page, activeTab, selectedCategory, toast]);

  // Update URL when page or filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    params.set('tab', activeTab);

    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }

    setSearchParams(params);
  }, [page, activeTab, selectedCategory, setSearchParams]);

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  // Handle video playback
  const togglePlayback = (reelId: string) => {
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

  // Handle like functionality with improved error handling
  const handleLike = async (id: string) => {
    try {
      // Direct fetch call for more reliable error handling
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels/${id}/like`;
      console.log('Liking reel with ID:', id);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Like response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Like response data:', data);
        
        if (data.success) {
          // Update likes count in the state
          setReels(reels.map(reel =>
            reel._id === id ? { ...reel, likes: reel.likes + 1 } : reel
          ));
          
          // Show success toast
          toast({
            title: "Success",
            description: "You liked this reel!",
            variant: "default",
          });
        } else {
          throw new Error(data.message || 'Failed to like reel');
        }
      } else {
        throw new Error(`Server returned ${response.status}`);
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

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset to page 1 when changing category
    setPage(1);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams(params => {
      params.set('tab', value);
      params.delete('page');
      return params;
    });
    setPage(1);
  };

  // Set selected category
  const setSelectedCategory = (categoryId: string) => {
    if (categoryId) {
      setSearchParams(params => {
        params.set('category', categoryId);
        return params;
      });
    } else {
      setSearchParams(params => {
        params.delete('category');
        return params;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Video Reels"
        description="Watch our latest video reels on various topics. Short video content and news reels from our contributors."
        url="/reels"
        keywords={['video reels', 'short videos', 'news reels', 'mibdaily']}
        image={reels[0]?.thumbnail ? getImageUrl(reels[0].thumbnail) : undefined}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video Reels</h1>
        <p className="text-gray-600">
          Watch short video content and news reels from our contributors.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category filter */}
        <div className="w-full md:w-auto">
          <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {!isLoading && !error && (
            <span>Showing {reels.length} of {totalReels} reels</span>
          )}
        </p>
      </div>

      {/* Reels Grid */}
      <div className="mb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(REELS_PER_PAGE)].map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="aspect-[9/16] bg-gray-200 animate-pulse" />
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
        ) : error && reels.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel) => (
              <Card key={reel._id} className="overflow-hidden">
                <div
                  className="relative aspect-[9/16] cursor-pointer"
                  onClick={() => togglePlayback(reel._id)}
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

                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{reel.title}</h3>

                  {reel.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {reel.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(reel._id);
                      }}
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
                      View Full Reel
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {reels.length === 0 && !isLoading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500">No reels found matching your criteria.</p>
            <Button onClick={() => {
              setSelectedCategory('');
              setSearchParams({ tab: 'latest' });
            }} variant="outline" className="mt-2">
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(page - 1)}>
                  Previous
                </PaginationLink>
              </PaginationItem>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <PaginationItem key={p}>
                <PaginationLink
                  onClick={() => handlePageChange(p)}
                  isActive={p === page}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            {page < totalPages && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(page + 1)}>
                  Next
                </PaginationLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ReelsPage;
