import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getImageUrl } from '@/lib/utils';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShortPost {
  _id: string;
  content: string;
  image?: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const ShortPostsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<ShortPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const activeTab = searchParams.get('tab') || 'latest';
  const { toast } = useToast();
  const POSTS_PER_PAGE = 12;

  // Fetch popular tags on component mount
  // Fallback tags to use when API fails
  const fallbackTags = [
    'news', 'politics', 'technology', 'sports', 'entertainment',
    'health', 'business', 'education', 'science', 'travel'
  ];

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        // Try direct fetch to avoid breaking if api client fails
        let tagsData = [];
        try {
          console.log('Fetching popular tags...');
          const response = await api.get('/short-posts/tags');
          console.log('Tags API response:', response);
          if (response && response.success && Array.isArray(response.data)) {
            tagsData = response.data;
            console.log('Successfully loaded tags from API:', tagsData);
          }
        } catch (apiError) {
          console.warn('API client failed to fetch tags, trying direct fetch', apiError);
          
          try {
            // Fallback to direct fetch
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const tagsUrl = `${baseUrl}/short-posts/tags`;
            const response = await fetch(tagsUrl);
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && Array.isArray(data.data)) {
                tagsData = data.data;
                console.log('Successfully loaded tags from direct fetch:', tagsData);
              }
            }
          } catch (fetchError) {
            console.error('Direct fetch also failed:', fetchError);
          }
        }
        
        // If we got tags from either method, use them
        if (tagsData && tagsData.length > 0) {
          setPopularTags(tagsData);
        } else if (import.meta.env.DEV) {
          // Use fallback tags in development mode
          console.log('Using fallback tags due to API failure');
          setPopularTags(fallbackTags);
        }
      } catch (error) {
        console.error('Failed to fetch popular tags:', error);
        if (import.meta.env.DEV) {
          // Use fallback tags in development
          setPopularTags(fallbackTags);
        }
      }
    };

    fetchPopularTags();
  }, []);
  
  // Fallback data for when API fails
  const getFallbackData = (): ShortPost[] => [
    {
      _id: 'fallback-1',
      content: 'Breaking: Government announces new development plan with significant funding for rural infrastructure projects. The initiative aims to connect remote areas with high-speed internet and improved transportation networks.',
      image: 'https://via.placeholder.com/600x400?text=Infrastructure+Project',
      author: {
        _id: 'author-1',
        name: 'Raj Sharma',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      likes: 124,
      comments: 18,
      shares: 45,
      tags: ['government', 'development', 'infrastructure'],
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: 'fallback-2',
      content: 'COVID-19 Update: Health Ministry reports a 30% decrease in new cases compared to last week. Vaccination drive continues with over 65% of eligible population now fully vaccinated.',
      image: 'https://via.placeholder.com/600x400?text=Healthcare+Update',
      author: {
        _id: 'author-2',
        name: 'Priya Patel',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      likes: 89,
      comments: 24,
      shares: 31,
      tags: ['covid19', 'healthcare', 'vaccination'],
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      _id: 'fallback-3',
      content: 'Tech giant launches new smartphone with revolutionary camera technology. The device features an advanced AI system that can identify objects and optimize settings automatically.',
      author: {
        _id: 'author-3',
        name: 'Vikram Singh',
        avatar: 'https://i.pravatar.cc/150?img=8'
      },
      likes: 215,
      comments: 42,
      shares: 78,
      tags: ['technology', 'smartphone', 'innovation'],
      createdAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
      _id: 'fallback-4',
      content: "Cricket: India defeats Australia in a thrilling final over finish. Captain's steady half-century and bowlers' disciplined performance led to the 3-wicket victory.",
      image: 'https://via.placeholder.com/600x400?text=Cricket+Match',
      author: {
        _id: 'author-4',
        name: 'Ajay Verma',
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      likes: 356,
      comments: 87,
      shares: 124,
      tags: ['cricket', 'sports', 'india'],
      createdAt: new Date(Date.now() - 36000000).toISOString(), // 10 hours ago
      updatedAt: new Date(Date.now() - 36000000).toISOString()
    },
    {
      _id: 'fallback-5',
      content: "Scientists discover potential new treatment for Alzheimer's disease. Early clinical trials show promising results in slowing cognitive decline.",
      author: {
        _id: 'author-5',
        name: 'Dr. Meena Gupta',
        avatar: 'https://i.pravatar.cc/150?img=20'
      },
      likes: 178,
      comments: 35,
      shares: 92,
      tags: ['science', 'healthcare', 'medicine'],
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: 'fallback-6',
      content: 'Weather Alert: Heavy rainfall expected across northern regions over the next 48 hours. Authorities advise residents to avoid unnecessary travel and stay updated with local news.',
      image: 'https://via.placeholder.com/600x400?text=Weather+Alert',
      author: {
        _id: 'author-6',
        name: 'Meteorology Dept',
        avatar: 'https://i.pravatar.cc/150?img=22'
      },
      likes: 67,
      comments: 29,
      shares: 56,
      tags: ['weather', 'alert', 'rainfall'],
      createdAt: new Date(Date.now() - 129600000).toISOString(), // 1.5 days ago
      updatedAt: new Date(Date.now() - 129600000).toISOString()
    }
  ];

  // Fetch posts with pagination and filters with improved error handling
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching short posts with page:', page, 'tab:', activeTab, 'tags:', activeTags);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', POSTS_PER_PAGE.toString());
        
        if (activeTab === 'trending') {
          params.append('sort', 'trending');
        } else if (activeTab === 'popular') {
          params.append('sort', 'popular');
        }
        
        if (activeTags.length > 0) {
          params.append('tags', activeTags.join(','));
        }
        
        // Use API client if available, otherwise use direct fetch
        let responseData;
        try {
          // Try using the api client first
          const apiResponse = await api.get(`/short-posts?${params.toString()}`);
          responseData = apiResponse;
          console.log('API client response:', apiResponse);
        } catch (clientError) {
          console.warn('API client failed, falling back to direct fetch', clientError);
          
          // Direct API call as fallback
          let baseUrl = import.meta.env.VITE_API_URL;
          if (!baseUrl) {
            // Default fallback URL if environment variable is not set
            baseUrl = 'http://localhost:5000/api';
          }
          
          // Ensure baseUrl doesn't end with a slash
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          
          const apiUrl = `${baseUrl}/short-posts?${params.toString()}`;
          console.log('Fetching from URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          console.log('Direct fetch response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          
          responseData = await response.json();
          console.log('Direct fetch response data:', responseData);
        }
        
        // Process the response data (whether from api client or direct fetch)
        console.log('Processing response data:', responseData);
        
        let extractedPosts = [];
        let totalItems = 0;
        
        try {
          // Handle different response formats
          if (responseData && responseData.success && responseData.data) {
            // Standard API response with success flag
            if (Array.isArray(responseData.data)) {
              // Flat array format
              extractedPosts = responseData.data;
              totalItems = extractedPosts.length;
            } else if (responseData.data.posts && Array.isArray(responseData.data.posts)) {
              // Object with posts array and pagination
              extractedPosts = responseData.data.posts;
              totalItems = responseData.data.totalCount || responseData.data.pagination?.total || extractedPosts.length;
            } else if (typeof responseData.data === 'object') {
              // Single post object
              extractedPosts = [responseData.data];
              totalItems = 1;
            } else {
              console.warn('Unexpected data format in success response', responseData.data);
              extractedPosts = [];
              totalItems = 0;
            }
          } else if (Array.isArray(responseData)) {
            // Direct array of posts
            extractedPosts = responseData;
            totalItems = extractedPosts.length;
          } else if (responseData && responseData.posts && Array.isArray(responseData.posts)) {
            // Object with posts array but no success flag
            extractedPosts = responseData.posts;
            totalItems = responseData.totalCount || responseData.pagination?.total || extractedPosts.length;
          } else {
            console.warn('Unexpected response format', responseData);
            extractedPosts = [];
            totalItems = 0;
          }
        } catch (formatError) {
          console.error('Error processing API response:', formatError);
          extractedPosts = [];
          totalItems = 0;
        }
        
        // If we couldn't get any posts from the API, use fallback data
        if (extractedPosts.length === 0 && import.meta.env.DEV) {
          console.log('No posts found from API, using fallback data');
          extractedPosts = getFallbackData();
          totalItems = extractedPosts.length;
        }
        
        // Calculate total pages and ensure it's at least 1
        const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / POSTS_PER_PAGE));
        
        setPosts(extractedPosts);
        setTotalPages(calculatedTotalPages);
        setError(null);
      } catch (error) {
        console.error('Error fetching posts:', error);
        let errorMessage = 'Failed to fetch short posts';
        if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        setPosts([]);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [page, activeTab, activeTags, toast]);

  // Update search params when tab or page changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (page !== 1) {
      newParams.set('page', page.toString());
    } else {
      newParams.delete('page');
    }
    
    if (activeTab !== 'latest') {
      newParams.set('tab', activeTab);
    } else {
      newParams.delete('tab');
    }
    
    setSearchParams(newParams, { replace: true });
  }, [page, activeTab, searchParams, setSearchParams]);

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Handle like functionality with improved error handling and feedback
  const handleLike = async (id: string) => {
    try {
      // Direct fetch call for more reliable error handling
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/short-posts/${id}/like`;
      console.log('Liking post with ID:', id);
      
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
          setPosts(posts.map(post => 
            post._id === id ? { ...post, likes: post.likes + 1 } : post
          ));
          
          // Show success toast
          toast({
            title: "Success",
            description: "You liked this post!",
            variant: "default",
          });
        } else {
          throw new Error(data.message || 'Failed to like post');
        }
      } else {
        throw new Error(`Server returned ${response.status}`);
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
  
  // Handle share functionality with improved error handling and user feedback
  const handleShare = async (post: ShortPost) => {
    try {
      // Create a shareable URL for this post
      const postUrl = `${window.location.origin}/short-posts/${post._id}`;
      console.log('Sharing post with ID:', post._id, 'URL:', postUrl);
      
      // Check if Web Share API is available
      if (navigator.share) {
        console.log('Using Web Share API');
        await navigator.share({
          title: `Post by ${getAuthorName(post.author)}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: postUrl
        });
        
        // Update share on server
        await updateShareCount(post._id);
      } else {
        // Fallback if Web Share API is not available
        console.log('Web Share API not available, using clipboard fallback');
        await navigator.clipboard.writeText(postUrl);
        
        toast({
          title: "Link Copied",
          description: "Post URL copied to clipboard!",
          variant: "default"
        });
        
        // Update share on server
        await updateShareCount(post._id);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      // Only show error toast if it wasn't just a user cancellation
      if (error instanceof Error && !error.message.includes('canceled')) {
        toast({
          title: "Share Error",
          description: "There was a problem sharing this post.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Helper function to update share count on server and in state
  const updateShareCount = async (postId: string) => {
    try {
      // Direct fetch for better error handling
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/short-posts/${postId}/share`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        // Update post shares count in the state
        setPosts(posts.map(p => 
          p._id === postId ? { ...p, shares: p.shares + 1 } : p
        ));
      } else {
        console.error('Error updating share count on server, status:', response.status);
      }
    } catch (error) {
      console.error('Error updating share count:', error);
    }
  };

  // Format timestamp to readable format
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

  // Handle tag selection
  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
    // Reset to page 1 when changing filters
    setPage(1);
  };

  // Extra safety check to ensure clean rendering
  React.useEffect(() => {
    // Recover from potential render errors with a fresh load
    const handleError = () => {
      console.log('Handling potential render error by reloading component state');
      setIsLoading(false);
      setError(null);
      setPosts([]);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Short Posts"
        description="Browse our collection of short posts on various topics. Quick updates and micro-content from our community."
        url="/short-posts"
        keywords={['short posts', 'quick news', 'micro content', 'mibnews']}
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Short Posts</h1>
        <p className="text-gray-600">
          Quick updates and micro-content from our community.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(value) => {
          setSearchParams(params => {
            params.set('tab', value);
            params.delete('page');
            return params;
          });
          setPage(1);
        }}>
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-2">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <Button
                key={tag}
                variant={activeTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className="rounded-full"
              >
                #{tag}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Short Posts List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(POSTS_PER_PAGE)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-3" />
                <Skeleton className="h-40 w-full mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error && posts.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Card key={post._id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Author info and timestamp */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center bg-primary text-white">
                      {getAuthorName(post.author).charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-sm">{getAuthorName(post.author)}</p>
                      <p className="text-gray-500 text-xs">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Post content */}
                <div className="mb-3">
                  <p className="text-sm">{post.content}</p>
                </div>
                
                {/* Post image if exists */}
                {post.image && (
                  <div className="mb-3 rounded-md overflow-hidden">
                    <img
                      src={getImageUrl(post.image)}
                      alt="Post"
                      className="w-full h-auto"
                    />
                  </div>
                )}
                
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Engagement stats */}
                <div className="flex justify-between border-t pt-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs gap-1"
                    onClick={() => handleLike(post._id)}
                  >
                    <Heart className="h-4 w-4" /> {post.likes}
                  </Button>
                  <Link to={`/short-posts/${post._id}`}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      <MessageCircle className="h-4 w-4" /> {post.comments}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs gap-1"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="h-4 w-4" /> {post.shares}
                  </Button>
                </div>
                <div className="mt-2 text-right">
                  <Link 
                    to={`/short-posts/${post._id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Full Post
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {posts.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">No posts found matching your criteria.</p>
          <Button onClick={() => {
            setActiveTags([]);
            setSearchParams({tab: 'latest'});
          }} variant="outline" className="mt-2">
            Clear filters
          </Button>
        </div>
      )}
      
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

export default ShortPostsPage;
