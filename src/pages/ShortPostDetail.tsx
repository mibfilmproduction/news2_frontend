import React, { useState, useEffect } from 'react';
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
import { Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

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

const ShortPostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<ShortPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [relatedPosts, setRelatedPosts] = useState<ShortPost[]>([]);
  const { toast } = useToast();

  // Function to fetch comments for a post
  const fetchComments = async (postId: string) => {
    try {
      const response = await api.get(`/short-posts/${postId}/comments`);
      if (response.success) {
        setComments(response.data);
      } else {
        console.error('Failed to fetch comments:', response.message);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };
  
  // Function to fetch related posts based on tags or most recent posts
  const fetchRelatedPosts = async (currentPost: ShortPost) => {
    try {
      let relatedUrl = '';
      let baseUrl = import.meta.env.VITE_API_URL;
      
      // Ensure we have a base URL
      if (!baseUrl) {
        baseUrl = 'http://localhost:5000/api';
      }
      
      // Ensure baseUrl doesn't end with a slash
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      // If post has tags, try to find related posts by tag
      if (currentPost.tags && currentPost.tags.length > 0) {
        const tag = currentPost.tags[0];
        relatedUrl = `${baseUrl}/short-posts?tag=${tag}&limit=5`;
      } 
      // Otherwise just get the latest posts
      else {
        relatedUrl = `${baseUrl}/short-posts?limit=5`;
      }
      
      console.log('Fetching related posts from:', relatedUrl);
      
      // Try using API client first
      try {
        const apiResponse = await api.get(
          currentPost.tags && currentPost.tags.length > 0
            ? `/short-posts?tag=${currentPost.tags[0]}&limit=5`
            : `/short-posts?limit=5`
        );
        
        if (apiResponse.success && apiResponse.data) {
          const filtered = apiResponse.data.filter(item => item._id !== currentPost._id).slice(0, 3);
          setRelatedPosts(filtered);
          return;
        }
      } catch (apiError) {
        console.warn('API client failed for related posts, falling back to direct fetch', apiError);
      }
      
      // Fallback to direct fetch
      const response = await fetch(relatedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch related posts: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract posts from various response formats
      let postsArray = [];
      if (data.data && Array.isArray(data.data)) {
        postsArray = data.data;
      } else if (data.posts && Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else if (Array.isArray(data)) {
        postsArray = data;
      }
      
      // Filter out the current post
      const filtered = postsArray.filter(item => item._id !== currentPost._id).slice(0, 3);
      console.log('Found related posts:', filtered.length);
      setRelatedPosts(filtered);
      
    } catch (error) {
      console.error('Error fetching related posts:', error);
      // Don't set an error state, this is a non-critical feature
    }
  };

  // Main data fetching logic
  useEffect(() => {
    if (!id) {
      setError('Post ID is missing');
      setLoading(false);
      return;
    }
    
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let postData;
        
        // Try using API client first
        try {
          const apiResponse = await api.get(`/short-posts/${id}`);
          if (apiResponse.success) {
            postData = apiResponse.data;
          } else {
            throw new Error(apiResponse.message || 'Failed to fetch post');
          }
        } catch (clientError) {
          console.warn('API client failed, falling back to direct fetch', clientError);
          
          // Direct API call as fallback
          let baseUrl = import.meta.env.VITE_API_URL;
          if (!baseUrl) {
            baseUrl = 'http://localhost:5000/api';
          }
          
          // Ensure baseUrl doesn't end with a slash
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          
          const apiUrl = `${baseUrl}/short-posts/${id}`;
          console.log('Fetching from URL:', apiUrl);
          
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const responseData = await response.json();
          
          // Handle different API response formats
          postData = null;
          
          // Case 1: Standard success format with data property
          if (responseData.success && responseData.data) {
            postData = responseData.data;
          }
          // Case 2: Direct object without success flag
          else if (responseData._id && typeof responseData.content === 'string') {
            postData = responseData;
          }
          // Case 3: Array of posts (find the matching one)
          else if (Array.isArray(responseData)) {
            postData = responseData.find(item => item._id === id);
          }
          // Case 4: Nested data formats
          else if (responseData.posts && Array.isArray(responseData.posts)) {
            postData = responseData.posts.find(item => item._id === id);
          }
          else {
            throw new Error('Received unexpected data format from server');
          }
          
          if (!postData) {
            // If we reached here, we couldn't extract the post data
            throw new Error('Could not find post data in API response');
          }
        }
        
        // Process the retrieved post data
        console.log('Processing post data:', postData);
        
        if (!postData) {
          throw new Error('No valid post data was retrieved');
        }
        
        // Set the post in state
        setPost(postData);
        
        // After successfully fetching the post, fetch comments
        await fetchComments(id);
        
        // Always fetch related posts, regardless of tags
        fetchRelatedPosts(postData);
      } catch (err) {
        let errorMessage = 'Failed to fetch post data. Please try again later.';
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

    fetchPost();
  }, [id, toast]);

  // Handle like action
  const handleLike = async () => {
    if (!post) return;
    
    try {
      // Optimistically update the UI
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          likes: prevPost.likes + 1
        };
      });
      
      // Try using API client first
      try {
        await api.post(`/short-posts/${post._id}/like`);
      } catch (clientError) {
        console.warn('API client failed, falling back to direct fetch', clientError);
        
        // Direct API call as fallback
        let baseUrl = import.meta.env.VITE_API_URL;
        if (!baseUrl) {
          baseUrl = 'http://localhost:5000/api';
        }
        
        // Ensure baseUrl doesn't end with a slash
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
        
        const apiUrl = `${baseUrl}/short-posts/${post._id}/like`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to like post. Server returned ${response.status}`);
        }
      }
      
      toast({
        title: 'Success',
        description: 'You liked this post!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Revert the optimistic update if request fails
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          likes: prevPost.likes - 1
        };
      });
      
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle share action
  const [isSharing, setIsSharing] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  const handleShare = async () => {
    if (!post) return;
    
    try {
      setIsSharing(true);
      // Create shareable URL
      const postUrl = `${window.location.origin}/short-posts/${post._id}`;
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `Short post by ${getAuthorName(post.author)}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          url: postUrl
        });
        
        // Update share count
        await updateShareCount(post._id);
        
        toast({
          title: 'Shared!',
          description: 'Post shared successfully',
          variant: 'default',
        });
      } else {
        // Show custom share dialog instead of just copying to clipboard
        setShareDialog(true);
        
        // Also copy to clipboard as a convenience
        await navigator.clipboard.writeText(postUrl);
        
        toast({
          title: 'Link Copied',
          description: 'Post URL copied to clipboard. Choose a sharing option or share this link directly.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      
      // Only show error toast if it wasn't just user cancellation
      if (error instanceof Error && !error.message.includes('canceled')) {
        toast({
          title: 'Error',
          description: 'Failed to share post. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Handle sharing to specific platforms
  const handleShareTo = async (platform: string) => {
    if (!post) return;
    
    try {
      setIsSharing(true);
      const postUrl = encodeURIComponent(`${window.location.origin}/short-posts/${post._id}`);
      const title = encodeURIComponent(`Short post by ${getAuthorName(post.author)}`);
      const text = encodeURIComponent(post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''));
      
      let shareUrl = '';
      
      switch(platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${postUrl}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`;
          break;
        case 'whatsapp':
          shareUrl = `https://api.whatsapp.com/send?text=${title}%20${postUrl}`;
          break;
        default:
          break;
      }
      
      if (shareUrl) {
        // Open share URL in a new window
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        
        // Update share count
        await updateShareCount(post._id);
        
        toast({
          title: 'Shared!',
          description: `Post shared to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          variant: 'default',
        });
      }
      
      // Close the dialog
      setShareDialog(false);
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast({
        title: 'Error',
        description: `Failed to share to ${platform}. Please try again later.`,
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Update share count helper
  const updateShareCount = async (postId: string) => {
    try {
      // Optimistically update UI for better user experience
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          shares: prevPost.shares + 1
        };
      });
      
      // Try using API client first
      try {
        await api.post(`/short-posts/${postId}/share`);
      } catch (clientError) {
        console.warn('API client failed to update share count, falling back to direct fetch', clientError);
        
        // Direct API call as fallback
        let baseUrl = import.meta.env.VITE_API_URL;
        if (!baseUrl) {
          baseUrl = 'http://localhost:5000/api';
        }
        
        // Ensure baseUrl doesn't end with a slash
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
        
        const apiUrl = `${baseUrl}/short-posts/${postId}/share`;
        console.log('Updating share count at URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update share count. Server returned ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error updating share count:', error);
      // We don't revert the optimistic update to avoid confusing the user
      // It's better to keep the count incremented even if the server update fails
    }
  };

  // Handle comment submission
  const submitComment = async () => {
    if (!post || !newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      let newCommentData;
      
      const postId = post?._id;
      const commentContent = newComment.trim();
      
      if (!postId) {
        throw new Error('Post ID is missing');
      }
      
      // Try using API client first
      try {
        const response = await api.post(`/short-posts/${postId}/comments`, {
          content: commentContent
        });
        
        if (response.success) {
          newCommentData = response.data;
        } else {
          throw new Error(response.message || 'Failed to post comment');
        }
      } catch (clientError) {
        console.warn('API client failed to post comment, falling back to direct fetch', clientError);
        
        // Direct API call as fallback
        let baseUrl = import.meta.env.VITE_API_URL;
        if (!baseUrl) {
          baseUrl = 'http://localhost:5000/api';
        }
        
        // Ensure baseUrl doesn't end with a slash
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
        
        const apiUrl = `${baseUrl}/short-posts/${postId}/comments`;
        console.log('Posting comment to URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: commentContent })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to post comment. Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the new comment from different response formats
        if (data.success && data.data) {
          newCommentData = data.data;
        } else if (data._id) {
          newCommentData = data;
        } else {
          throw new Error('Could not extract comment data from response');
        }
      }
      
      if (newCommentData) {
        // Add the new comment to the list
        setComments(prevComments => [newCommentData, ...prevComments]);
        // Update comment count on the post
        setPost(prevPost => {
          if (!prevPost) return prevPost;
          return {
            ...prevPost,
            comments: prevPost.comments + 1
          };
        });
        
        // Clear the input
        setNewComment('');
        
        toast({
          title: 'Comment Posted',
          description: 'Your comment has been added successfully!',
          variant: 'default',
        });
      } else {
        throw new Error('No valid comment data received');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Helper functions
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

  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown';
    return author?.name || 'Unknown';
  };

  const getAuthorAvatar = (author: any) => {
    if (typeof author === 'string') return null;
    return author?.avatar ? getImageUrl(author.avatar) : null;
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              {/* Author info skeleton */}
              <div className="flex items-center space-x-3 mb-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              
              {/* Post content skeleton */}
              <div className="space-y-4 mb-8">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-64 w-full mb-4" />
              </div>
              
              {/* Tags skeleton */}
              <div className="flex space-x-2 mb-6">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              
              {/* Engagement stats skeleton */}
              <div className="flex justify-between border-t border-b py-3 mb-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              
              {/* Comments section skeleton */}
              <div className="mt-8">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/short-posts">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Posts
            </Link>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Check for post existence separately to show a more specific message
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/short-posts">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Posts
            </Link>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Article Found</h1>
          <p className="mb-6 text-gray-600">The article you're looking for could not be found. It may have been removed or is temporarily unavailable.</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
            <Button asChild>
              <Link to="/short-posts">View All Articles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={`${post.content.substring(0, 50)}...`}
        description={post.content.substring(0, 160)}
        url={`/short-posts/${post.slug || post._id}`}
        type="article"
        image={getAuthorAvatar(post.author) || undefined}
      />
      
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/short-posts">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Posts
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            {/* Author info */}
            <div className="flex items-center space-x-3 mb-6">
              <Avatar>
                <AvatarImage src={getAuthorAvatar(post.author) || undefined} alt={getAuthorName(post.author)} />
                <AvatarFallback>{getAuthorName(post.author).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{getAuthorName(post.author)}</h3>
                <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
              </div>
            </div>

            {/* Post content */}
            <div className="mb-6">
              <p className="text-lg mb-4">{post.content}</p>
              
              {post.image && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <img
                    src={getImageUrl(post.image)}
                    alt="Post"
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Engagement stats */}
            <div className="flex justify-between border-t border-b py-3 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" /> <span>{post.likes} likes</span>
              </Button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" /> <span>{post.comments} comments</span>
              </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className={`h-4 w-4 ${isSharing ? 'animate-pulse' : ''}`} /> 
                  <span>{post.shares} shares</span>
                </Button>
            </div>

            {/* Advertisement Banner */}
            <div className="mb-6 p-4 bg-gray-100 rounded-md border border-gray-200 text-center overflow-hidden">
              <div className="text-sm text-gray-500 mb-1">ADVERTISEMENT</div>
              <div className="bg-white p-3 rounded shadow-sm">
                {/* Local placeholder instead of external service */}
                <div 
                  className="w-full h-[120px] rounded bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center"
                  style={{ border: '1px solid #e5e7eb' }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">Your Ad Here</div>
                    <div className="text-xs text-gray-500 mt-1">600 x 120</div>
                  </div>
                </div>
                <div className="text-sm font-medium mt-2">Sponsored Content</div>
                <p className="text-xs text-gray-600 mt-1">Promote your business here and reach our readers</p>
                <button className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition">Learn More</button>
              </div>
            </div>
            
            {/* Related Posts Section */}
            <div className="mb-8">
              <h3 className="font-medium text-xl border-b pb-2 mb-4">Related Posts</h3>
              {relatedPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {relatedPosts.map(relatedPost => (
                    <Card key={relatedPost._id} className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300">
                      <Link to={`/short-posts/${relatedPost._id}`}>
                        {relatedPost.image ? (
                          <div className="h-[140px] sm:h-[160px] overflow-hidden">
                            <img 
                              src={getImageUrl(relatedPost.image)}
                              alt="Post"
                              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                            />
                          </div>
                        ) : (
                          <div className="h-[80px] bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                            <span className="text-gray-600 text-xs font-medium">Mibnews</span>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="line-clamp-3 text-sm mb-2 font-medium">{relatedPost.content}</p>
                          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Avatar className="h-5 w-5 mr-1">
                                <AvatarFallback>{getAuthorName(relatedPost.author).charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span>{getAuthorName(relatedPost.author)}</span>
                            </div>
                            <span>{formatTimeAgo(relatedPost.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-gray-200 rounded-full mb-3"></div>
                    <p className="text-gray-500 mb-2">Finding related articles for you...</p>
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              )}
            </div>
            
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
      
      {/* Share Dialog */}
      {shareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Share This Post</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2" 
                onClick={() => handleShareTo('twitter')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
                </svg>
                <span>Twitter</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2" 
                onClick={() => handleShareTo('facebook')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 12a8 8 0 1 0-9.25 7.903v-5.59H8.719V12h2.031v-1.762c0-2.005 1.194-3.113 3.022-3.113.875 0 1.79.156 1.79.156v1.969h-1.008c-.994 0-1.304.617-1.304 1.25V12h2.219l-.355 2.313H13.25v5.59A8.002 8.002 0 0 0 20 12Z"></path>
                </svg>
                <span>Facebook</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2" 
                onClick={() => handleShareTo('linkedin')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.7 3H4.3A1.3 1.3 0 003 4.3v15.4A1.3 1.3 0 004.3 21h15.4a1.3 1.3 0 001.3-1.3V4.3A1.3 1.3 0 0019.7 3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 11-.002-3.096 1.548 1.548 0 01.002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.249h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z"></path>
                </svg>
                <span>LinkedIn</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2" 
                onClick={() => handleShareTo('whatsapp')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                </svg>
                <span>WhatsApp</span>
              </Button>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShareDialog(false)}>Cancel</Button>
              <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/short-posts/${post._id}`); toast({ title: 'Link Copied', description: 'Post URL copied to clipboard', variant: 'default' }); }}>Copy Link</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortPostDetail;
