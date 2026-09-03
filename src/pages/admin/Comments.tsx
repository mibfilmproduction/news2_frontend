import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, MessageSquare, Trash, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import useAuth from "@/hooks/useAuth";
import { CommentType, updateCommentStatus as updateCommentStatusApi, deleteComment as deleteCommentApi } from "@/services/commentService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for comment with article info
interface CommentWithArticle extends CommentType {
  articleTitle?: string;
  articleSlug?: string;
}

// Interface for API response containing articles
interface ArticleData {
  _id: string;
  title: string;
  slug: string;
}

// Function to fetch all comments from the API
const fetchAllComments = async (): Promise<CommentWithArticle[]> => {
  try {
    const response = await api.get('/comments');
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Function to fetch article details for comments
const enrichCommentsWithArticleInfo = async (comments: CommentType[]): Promise<CommentWithArticle[]> => {
  // Get unique article IDs, ensuring they are valid strings
  const articleIds = [...new Set(comments.map(comment => {
    // Check if article is a valid string ID
    if (typeof comment.article === 'string' && comment.article.trim() !== '') {
      return comment.article;
    }
    return null;
  }))].filter(id => id !== null) as string[];
  
  // Fetch article details for each ID
  const articleDetails: Record<string, ArticleData> = {};
  
  for (const articleId of articleIds) {
    try {
      // Ensure articleId is a valid string before making the API call
      if (typeof articleId === 'string' && articleId.trim() !== '') {
        const response = await api.get(`/news/${articleId}`);
        if (response.success && response.data) {
          articleDetails[articleId] = response.data;
        }
      }
    } catch (error) {
      console.error(`Error fetching article ${articleId}:`, error);
    }
  }
  
  // Enrich comments with article info
  return comments.map(comment => {
    // Ensure article is a valid string ID
    const articleId = typeof comment.article === 'string' ? comment.article : '';
    return {
      ...comment,
      articleTitle: articleDetails[articleId]?.title || 'Unknown Article',
      articleSlug: articleDetails[articleId]?.slug || '',
    };
  });
};

const Comments = () => {
  const [comments, setComments] = useState<CommentWithArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Load comments on component mount
  useEffect(() => {
    // Check for token in both localStorage and sessionStorage
    const localToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('token');
    
    if (!localToken && !sessionToken) {
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please log in again.",
        variant: "destructive",
      });
      navigate('/login?redirect=/admin/comments');
      return;
    }
    
    if (!isAuthenticated || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to access this page",
        variant: "destructive",
      });
      navigate('/login?redirect=/admin/comments');
      return;
    }
    
    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all comments
        const allComments = await fetchAllComments();
        
        // Enrich comments with article information
        const enrichedComments = await enrichCommentsWithArticleInfo(allComments);
        
        setComments(enrichedComments);
      } catch (err: any) {
        console.error('Error loading comments:', err);
        
        // Handle authentication errors
        if (err?.status === 401 || err?.message?.includes('unauthorized')) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          // Clear tokens
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          navigate('/login?redirect=/admin/comments');
        } else {
          setError('Failed to load comments. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadComments();
  }, [isAuthenticated, isAdmin, navigate, toast]);

  // Filter comments based on search term and status filter
  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comment.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comment.articleTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || comment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return "success";
      case 'pending': return "outline";
      case 'rejected': return "destructive";
      case 'spam': return "secondary";
      default: return "outline";
    }
  };

  // Function to update comment status
  const updateCommentStatus = async (_id: string, newStatus: 'approved' | 'pending' | 'rejected' | 'spam') => {
    try {
      const updatedComment = await updateCommentStatusApi(_id, newStatus);
      
      if (updatedComment) {
        // Update the comment in the state
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === _id 
              ? { ...comment, status: newStatus }
              : comment
          )
        );
        
        toast({
          title: "Status Updated",
          description: `Comment status changed to ${newStatus}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update comment status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating comment status:', error);
      
      // Handle authentication errors
      if (error?.status === 401 || error?.message?.includes('unauthorized')) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Clear tokens
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login?redirect=/admin/comments');
      } else {
        toast({
          title: "Error",
          description: "Failed to update comment status",
          variant: "destructive",
        });
      }
    }
  };

  // Function to delete a comment
  const deleteComment = async (_id: string) => {
    try {
      const success = await deleteCommentApi(_id);
      
      if (success) {
        // If it's a reply, we need to remove it from its parent's replies
        const isReply = comments.some(c => c.replies?.some(r => r._id === _id));
        
        if (isReply) {
          // Update comments by removing the reply from its parent
          setComments(prevComments => 
            prevComments.map(comment => {
              if (comment.replies?.some(r => r._id === _id)) {
                return {
                  ...comment,
                  replies: comment.replies.filter(r => r._id !== _id)
                };
              }
              return comment;
            })
          );
        } else {
          // Remove the top-level comment
          setComments(prevComments => 
            prevComments.filter(comment => comment._id !== _id)
          );
        }
        
        toast({
          title: "Comment Deleted",
          description: "Comment has been permanently removed",
          variant: "default",
        });
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      // Handle authentication errors
      if (error?.status === 401 || error?.message?.includes('unauthorized')) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Clear tokens
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login?redirect=/admin/comments');
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete comment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate comment counts for each status
  const commentCounts = {
    all: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length,
    spam: comments.filter(c => c.status === 'spam').length,
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <MessageSquare className="mr-2 h-6 w-6" /> Comment Management
          </CardTitle>
          <CardDescription>
            Review and moderate user comments across all articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search comments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="p-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Comments ({commentCounts.all})</option>
              <option value="pending">Pending Review ({commentCounts.pending})</option>
              <option value="approved">Approved ({commentCounts.approved})</option>
              <option value="rejected">Rejected ({commentCounts.rejected})</option>
              <option value="spam">Spam ({commentCounts.spam})</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
            <Card 
              className={`cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">All</p>
                  <p className="text-2xl font-bold">{commentCounts.all}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-500" />
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{commentCounts.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer ${statusFilter === 'approved' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('approved')}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold">{commentCounts.approved}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer ${statusFilter === 'spam' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('spam')}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Spam</p>
                  <p className="text-2xl font-bold">{commentCounts.spam}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer ${statusFilter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold">{commentCounts.rejected}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Loading comments...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length > 0 ? (
                filteredComments.map(comment => (
                  <React.Fragment key={comment._id}>
                    <TableRow>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2">{comment.content}</div>
                      </TableCell>
                      <TableCell>
                        <div>{comment.user?.name || 'Anonymous'}</div>
                        <div className="text-xs text-gray-500">{comment.user?._id || 'No ID'}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {comment.articleTitle || 'Unknown Article'}
                      </TableCell>
                      <TableCell>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(comment.status)}>
                          {comment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {comment.status !== 'approved' && (
                              <DropdownMenuItem onClick={() => updateCommentStatus(comment._id, 'approved')}>
                                <Check className="mr-2 h-4 w-4 text-green-500" />Approve
                              </DropdownMenuItem>
                            )}
                            {comment.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => updateCommentStatus(comment._id, 'rejected')}>
                                <X className="mr-2 h-4 w-4" />Reject
                              </DropdownMenuItem>
                            )}
                            {comment.status !== 'spam' && (
                              <DropdownMenuItem onClick={() => updateCommentStatus(comment._id, 'spam')}>
                                <span className="mr-2">🚫</span>Mark as Spam
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => deleteComment(comment._id)}
                              className="text-red-600 focus:text-red-600">
                              <Trash className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Render replies */}
                    {comment.replies?.map(reply => (
                      <TableRow key={reply._id} className="bg-gray-50">
                        <TableCell className="max-w-md pl-8 border-l-4 border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">↪️ Reply to {comment.user?.name || 'Anonymous'}</div>
                          <div className="line-clamp-2">{reply.content}</div>
                        </TableCell>
                        <TableCell>
                          <div>{reply.user?.name || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{reply.user?._id || 'No ID'}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {comment.articleTitle || 'Unknown Article'}
                        </TableCell>
                        <TableCell>
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(reply.status)}>
                            {reply.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {reply.status !== 'approved' && (
                                <DropdownMenuItem onClick={() => updateCommentStatus(reply._id, 'approved')}>
                                  <Check className="mr-2 h-4 w-4 text-green-500" />Approve
                                </DropdownMenuItem>
                              )}
                              {reply.status !== 'rejected' && (
                                <DropdownMenuItem onClick={() => updateCommentStatus(reply._id, 'rejected')}>
                                  <X className="mr-2 h-4 w-4" />Reject
                                </DropdownMenuItem>
                              )}
                              {reply.status !== 'spam' && (
                                <DropdownMenuItem onClick={() => updateCommentStatus(reply._id, 'spam')}>
                                  <span className="mr-2">🚫</span>Mark as Spam
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => deleteComment(reply._id)}
                                className="text-red-600 focus:text-red-600">
                                <Trash className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    {loading ? 'Loading comments...' : 'No comments found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Comments;
