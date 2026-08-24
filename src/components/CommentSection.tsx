import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { 
  getComments, 
  submitComment, 
  CommentType 
} from '@/services/commentService';

interface CommentProps {
  articleId: string;
}

// Using CommentType from the commentService

const CommentSection: React.FC<CommentProps> = ({ articleId }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use our dedicated service function to fetch comments
      const commentsData = await getComments(articleId);
      
      if (commentsData && Array.isArray(commentsData) && commentsData.length > 0) {
        // Group replies under their parent comments
        const commentsWithReplies = organizeComments(commentsData);
        setComments(commentsWithReplies);
        console.log(`Loaded ${commentsData.length} comments successfully`);
      } else {
        // No comments found or the API returned an unexpected format
        console.log('No comments found or invalid response format');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again later.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to organize comments into a parent-child structure
  const organizeComments = (flatComments: CommentType[]): CommentType[] => {
    // First filter to only approved comments
    const approvedComments = flatComments.filter(comment => comment.status === 'approved');
    
    // Initialize top-level comments
    const topLevelComments: CommentType[] = [];
    // Map to store all comments by their ID
    const commentMap = new Map<string, CommentType>();
    
    // First pass: add all comments to the map
    approvedComments.forEach(comment => {
      commentMap.set(comment._id, {...comment, replies: []});
    });
    
    // Second pass: organize into hierarchy
    approvedComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment._id);
      if (commentWithReplies) {
        if (comment.parent) {
          // This is a reply, add it to its parent
          const parentComment = commentMap.get(comment.parent);
          if (parentComment && parentComment.replies) {
            parentComment.replies.push(commentWithReplies);
          }
        } else {
          // This is a top-level comment
          topLevelComments.push(commentWithReplies);
        }
      }
    });
    
    return topLevelComments;
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post comments",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Verify token is available before attempting submission
      const userToken = localStorage.getItem('token') || 
                       sessionStorage.getItem('token') ||
                       JSON.parse(localStorage.getItem('user') || '{}')?.token ||
                       JSON.parse(sessionStorage.getItem('user') || '{}')?.token;
      
      if (!userToken) {
        // Token missing - need to redirect to login
        toast({
          title: "Session Expired",
          description: "Your login session has expired. Please log in again.",
          variant: "destructive",
        });
        
        // Clear any existing invalid tokens
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }, 1500);
        return;
      }
      
      // Use our dedicated service function for submitting comments
      const result = await submitComment(
        articleId, 
        commentText, 
        replyTo || undefined
      );
      
      if (result) {
        toast({
          title: "Comment Submitted Successfully",
          description: "Your comment has been submitted and is awaiting moderation.",
          variant: "default",
        });
        
        setCommentText('');
        setReplyTo(null);
        fetchComments(); // Refresh comments list
      } else {
        console.error('Comment submission failed');
        setError('Failed to submit your comment. Please try again later.');
        toast({
          title: "Comment Submission Failed",
          description: "We couldn't submit your comment at this time. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Handle authentication errors specifically
      if (error instanceof Error && 
          (error.message.includes('Authentication') || 
           error.message.includes('token') || 
           error.message.includes('unauthorized'))) {
        setError('Authentication error. Please log in again.');
        toast({
          title: "Authentication Failed",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        });
      } else {
        // Generic error handling
        setError('An error occurred while submitting your comment.');
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const renderComment = (comment: CommentType, isReply = false) => (
    <div key={comment._id} className={`mb-4 ${isReply ? 'ml-8' : ''}`}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-semibold">{comment.user.name}</h4>
              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
            {isAuthenticated && !isReply && (
              <Button 
                variant="ghost" 
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setReplyTo(comment._id)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">Comments</h2>
      
      {/* Show error message if there is one */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-xs"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}
      
      {/* Comment input area */}
      {isAuthenticated ? (
        <div className="mb-8">
          <div className="mb-2">
            {replyTo && (
              <div className="text-sm text-gray-600 mb-2">
                Replying to a comment. 
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setReplyTo(null)}
                  className="text-xs"
                >
                  Cancel Reply
                </Button>
              </div>
            )}
            <Textarea
              placeholder={replyTo ? "Write a reply..." : "Join the discussion..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button 
              variant="default"
              disabled={submitting || !commentText.trim()} 
              onClick={handleSubmitComment}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : 'Post Comment'}
            </Button>
            {/* Add a retry button */}
            {error && (
              <Button 
                variant="outline" 
                size="sm"
                className="ml-2"
                onClick={() => {
                  setError(null);
                  toast({
                    title: "Connection Reset",
                    description: "Trying to reconnect to servers...", 
                    variant: "default"
                  });
                  fetchComments(); // Retry fetching comments
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-100 rounded-md text-center">
          <p className="mb-2">Please log in to join the discussion</p>
          <Button size="sm" asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      )}
      
      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
