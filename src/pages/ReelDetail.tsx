import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { api } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, ArrowLeft, Video, Share2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
  shares?: number;
  author: {
    _id: string;
    name: string;
    avatar?: string;
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

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  createdAt: string;
}

const ReelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [reel, setReel] = useState<Reel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [relatedReels, setRelatedReels] = useState<Reel[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Add debugging logs to track the process
  console.log('ReelDetail initialized with ID:', id);
  
  useEffect(() => {
    const fetchReel = async () => {
      if (!id) {
        console.error('No reel ID provided');
        setError('Reel ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching reel with ID:', id);
        
        // Direct API call with better error handling
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels/${id}`;
        console.log('Fetching from URL:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          console.log('API response status:', response.status);
          
          // Parse the response data with error handling
          let responseData;
          try {
            responseData = await response.json();
            console.log('Reel data received:', responseData);
          } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            throw new Error('Failed to parse server response');
          }
          
          // Handle different API response formats
          let reelData = null;
          
          // Case 1: Standard success format with data property
          if (responseData.success && responseData.data) {
            reelData = responseData.data;
          }
          // Case 2: Direct object without success flag
          else if (responseData._id && responseData.videoUrl) {
            reelData = responseData;
          }
          // Case 3: Array of reels (find the matching one)
          else if (Array.isArray(responseData)) {
            reelData = responseData.find(item => item._id === id);
          }
          // Case 4: Nested data formats
          else if (responseData.reels && Array.isArray(responseData.reels)) {
            reelData = responseData.reels.find(item => item._id === id);
          }
          
          if (reelData) {
            console.log('Successfully extracted reel data:', reelData);
            setReel(reelData);
            fetchComments(id);
            
            // If we have the reel data, fetch related reels
            fetchRelatedReels(reelData);
            return;
          }
          
          // If we reached here, we couldn't extract the reel data
          throw new Error('Could not find reel data in API response');
          
        } catch (fetchError) {
          console.error('Direct fetch error:', fetchError);
          // Fall back to fetching from list
          console.log('Trying fallback: fetching from reels list');
          
          const listUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels?limit=50`;
          console.log('Fetching reels list from:', listUrl);
          
          const listResponse = await fetch(listUrl);
          if (!listResponse.ok) {
            throw new Error(`Fallback fetch failed with status ${listResponse.status}`);
          }
          
          const listData = await listResponse.json();
          console.log('Reels list received, searching for reel ID:', id);
          
          // Try to find the reel in various response formats
          let reelsArray = [];
          if (listData.data && Array.isArray(listData.data)) {
            reelsArray = listData.data;
          } else if (listData.reels && Array.isArray(listData.reels)) {
            reelsArray = listData.reels;
          } else if (Array.isArray(listData)) {
            reelsArray = listData;
          }
          
          const foundReel = reelsArray.find(reel => reel._id === id);
          
          if (foundReel) {
            console.log('Found reel in list:', foundReel);
            setReel(foundReel);
            fetchComments(id);
            fetchRelatedReels(foundReel);
          } else {
            throw new Error('Reel not found in any available data source');
          }
        }
      } catch (err) {
        console.error('Error fetching reel:', err);
        let errorMessage = 'Failed to fetch reel data. Please try again later.';
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReel();
  }, [id, toast]);

  const fetchComments = async (reelId: string) => {
    try {
      const response = await api.get(`/reels/${reelId}/comments`);
      if (response.success) {
        setComments(response.data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  // Fetch related reels based on category or tags
  const fetchRelatedReels = async (currentReel: Reel) => {
    try {
      console.log('Fetching related reels');
      let relatedUrl = '';
      
      // If reel has category, try to find related reels by category
      if (currentReel.category) {
        const categoryId = typeof currentReel.category === 'string' 
          ? currentReel.category 
          : currentReel.category._id;
        
        relatedUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels?category=${categoryId}&limit=3`;
      }
      // If no category but has tags, try to find by tag
      else if (currentReel.tags && currentReel.tags.length > 0) {
        const tag = currentReel.tags[0];
        relatedUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels?tag=${tag}&limit=3`;
      } 
      // Otherwise just get the latest reels
      else {
        relatedUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels?limit=3`;
      }
      
      console.log('Fetching related reels from:', relatedUrl);
      
      const response = await fetch(relatedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch related reels: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Related reels data:', data);
      
      // Extract reels from various response formats
      let reelsArray = [];
      if (data.data && Array.isArray(data.data)) {
        reelsArray = data.data;
      } else if (data.reels && Array.isArray(data.reels)) {
        reelsArray = data.reels;
      } else if (Array.isArray(data)) {
        reelsArray = data;
      }
      
      // Filter out the current reel
      const filtered = reelsArray.filter(item => item._id !== currentReel._id).slice(0, 3);
      console.log(`Found ${filtered.length} related reels`);
      setRelatedReels(filtered);
      
    } catch (error) {
      console.error('Error fetching related reels:', error);
      // Don't set an error state, this is a non-critical feature
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // Attempt to play the video
      const playPromise = videoRef.current.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing video:', error);
            setIsPlaying(false);
          });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!reel) return;
    
    try {
      const response = await api.post(`/reels/${reel._id}/like`);
      if (response.success) {
        setReel({
          ...reel,
          likes: reel.likes + 1
        });
        toast({
          title: 'Success',
          description: 'You liked this reel!',
          variant: 'default',
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to like reel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!reel) return;
    
    try {
      // Create a shareable URL for this reel
      const reelUrl = window.location.href;
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: reel.title,
          text: reel.description || `Watch this reel: ${reel.title}`,
          url: reelUrl
        });
        
        // Update share count
        updateShareCount();
      } else {
        // Fallback if Web Share API is not available
        await navigator.clipboard.writeText(reelUrl);
        
        toast({
          title: "Link Copied",
          description: "Reel URL copied to clipboard!",
          variant: "default"
        });
        
        // Update share count
        updateShareCount();
      }
    } catch (error) {
      console.error('Error sharing reel:', error);
      // Only show error toast if it wasn't just a user cancellation
      if (error instanceof Error && !error.message.includes('canceled')) {
        toast({
          title: "Share Error",
          description: "There was a problem sharing this reel.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Helper function to update share count on server and in state
  const updateShareCount = async () => {
    if (!reel) return;
    
    try {
      const response = await api.post(`/reels/${reel._id}/share`);
      if (response.success) {
        // Update reel shares count in the state
        setReel({
          ...reel,
          shares: (reel.shares || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error updating share count:', error);
    }
  };

  const submitComment = async () => {
    if (!reel || !newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      console.log('Submitting comment for reel ID:', reel._id);
      
      // Direct fetch call for better error handling
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reels/${reel._id}/comments`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment })
      });
      
      console.log('Comment submission status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }
      
      // Parse the response data safely
      let responseData;
      try {
        responseData = await response.json();
        console.log('Comment submission response:', responseData);
      } catch (parseError) {
        console.error('Error parsing comment response:', parseError);
        throw new Error('Failed to parse server response for comment');
      }
      
      // Extract the comment data
      let commentData = null;
      
      // Case 1: Standard success format with data property
      if (responseData.success && responseData.data) {
        commentData = responseData.data;
      }
      // Case 2: Direct object response
      else if (responseData._id && responseData.content) {
        commentData = responseData;
      }
      // Case 3: Nested data formats
      else if (responseData.comment) {
        commentData = responseData.comment;
      }
      
      if (commentData) {
        console.log('Successfully extracted comment data:', commentData);
        
        // Ensure comment has all required fields
        const processedComment = {
          _id: commentData._id,
          content: commentData.content,
          author: commentData.author || { name: 'Anonymous' },
          createdAt: commentData.createdAt || new Date().toISOString()
        };
        
        // Add the new comment to the list
        setComments([processedComment, ...comments]);
        
        // Update comment count on the reel
        setReel({
          ...reel,
          comments: reel.comments + 1
        });
        
        // Clear the input
        setNewComment('');
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Your comment has been posted!',
          variant: 'default',
        });
      } else {
        console.error('Could not extract comment data from response:', responseData);
        throw new Error('Received invalid comment data from server');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      let errorMessage = 'Failed to post comment. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Format duration (seconds) to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  // Get author avatar
  const getAuthorAvatar = (author: any) => {
    if (typeof author === 'string') return null;
    return author?.avatar ? getImageUrl(author.avatar) : null;
  };

  // Get category name helper function
  const getCategoryName = (category: any) => {
    if (!category) return null;
    if (typeof category === 'string') return null;
    return category?.name || null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            {/* Video placeholder */}
            <div className="aspect-video bg-gray-200 rounded-md mb-6"></div>
            
            {/* Title placeholder */}
            <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
            
            {/* Author info placeholder */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Description placeholder */}
            <div className="space-y-4 mb-8">
              <div className="h-5 w-full bg-gray-200 rounded"></div>
              <div className="h-5 w-full bg-gray-200 rounded"></div>
              <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
            </div>
            
            {/* Tags placeholder */}
            <div className="flex space-x-2 mb-6">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
            
            {/* Stats placeholder */}
            <div className="flex justify-between border-t border-b py-3 mb-6">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
            
            {/* Comments section placeholder */}
            <div className="mt-8">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 w-full bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="h-16 w-full bg-gray-200 rounded"></div>
                <div className="h-16 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reels">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reels
            </Link>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-4">{error || 'Reel not found'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={reel.title}
        description={reel.description || reel.title}
        url={`/reels/${reel._id}`}
        type="article"
        image={reel.thumbnail ? getImageUrl(reel.thumbnail) : undefined}
      />
      
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reels">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reels
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">{reel.title}</h1>
            
            {/* Video */}
            <div className="relative mb-6 bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                src={getImageUrl(reel.videoUrl)}
                poster={reel.thumbnail ? getImageUrl(reel.thumbnail) : undefined}
                className="w-full aspect-video object-contain"
                loop
                playsInline
                onClick={togglePlayback}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
              />
              
              {/* Large play button overlay for better UX */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isPlaying && (
                  <div className="bg-black bg-opacity-30 rounded-full p-4">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
              
              {/* Video controls */}
              <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black bg-opacity-50 hover:bg-opacity-70"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black bg-opacity-50 hover:bg-opacity-70"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
                  </Button>
                </div>
                
                <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  {formatDuration(reel.duration)}
                </span>
              </div>
            </div>
            
            {/* Description */}
            {reel.description && (
              <div className="mb-6">
                <p className="text-lg">{reel.description}</p>
              </div>
            )}
            
            {/* Tags */}
            {reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {reel.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center justify-between border-t border-b py-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{reel.views} views</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" /> <span>{reel.likes} likes</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" /> <span>{reel.shares || 0} shares</span>
              </Button>
            </div>
            
            {/* Related Reels Section */}
            {relatedReels.length > 0 && (
              <div className="mt-8 mb-8">
                <h3 className="font-medium text-xl border-b pb-2 mb-4">Related Reels</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedReels.map(relatedReel => (
                    <Card key={relatedReel._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <Link to={`/reels/${relatedReel._id}`}>
                        <div className="h-[160px] overflow-hidden relative">
                          {relatedReel.thumbnail ? (
                            <img
                              src={getImageUrl(relatedReel.thumbnail)}
                              alt={relatedReel.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Play className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {/* Duration badge */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(relatedReel.duration)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium line-clamp-2 mb-2">{relatedReel.title}</h4>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{getAuthorName(relatedReel.author)}</span>
                            <span>{formatTimeAgo(relatedReel.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Comments section */}
            <div>
              <h3 className="font-medium mb-4">Comments</h3>
              
              {/* Comment form */}
              <div className="mb-6">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  onClick={submitComment} 
                  disabled={!newComment.trim() || commentLoading}
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
              
              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment._id} className="border-b pb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getAuthorName(comment.author).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{getAuthorName(comment.author)}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm pl-10">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReelDetail;
