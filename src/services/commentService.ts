/**
 * Comment Service
 * Provides API functions for working with article comments
 */

import { api } from '@/lib/api-client';

export interface CommentType {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  article: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parent?: string;
  replies?: CommentType[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get comments for an article
 * @param articleId The article ID to fetch comments for
 * @returns Array of comments or empty array if none found
 */
export const getComments = async (articleId: string): Promise<CommentType[]> => {
  try {
    // Try multiple endpoints to ensure compatibility with different API structures
    const endpoints = [
      `/comments/article/${articleId}`,
      `/articles/${articleId}/comments`,
      `/news/${articleId}/comments`
    ];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      const response = await api.get(endpoint);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    console.warn('No valid comments data found for article:', articleId);
    return [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Submit a new comment
 * @param articleId The article ID to comment on
 * @param content The comment content
 * @param parentId Optional parent comment ID for replies
 * @returns The created comment or null if submission failed
 */
export const submitComment = async (
  articleId: string, 
  content: string, 
  parentId?: string
): Promise<CommentType | null> => {
  try {
    // Prepare comment data
    const commentData = {
      article: articleId,
      content,
      ...(parentId && { parent: parentId })
    };
    
    // Use the correct endpoint based on backend implementation
    // From the routes, we know that POST /api/comments is the only valid endpoint
    const response = await api.post('/comments', commentData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    console.warn('Failed to submit comment for article:', articleId);
    return null;
  } catch (error) {
    console.error('Error submitting comment:', error);
    return null;
  }
};

/**
 * Get replies for a comment
 * @param commentId The comment ID to fetch replies for
 * @returns Array of reply comments or empty array if none found
 */
export const getCommentReplies = async (commentId: string): Promise<CommentType[]> => {
  try {
    const response = await api.get(`/comments/${commentId}/replies`);
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    return [];
  }
};

/**
 * Delete a comment
 * @param commentId The comment ID to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.success;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

/**
 * Update a comment's status (for moderation)
 * @param commentId The comment ID to update
 * @param status The new status ('approved', 'rejected', 'pending', 'spam')
 * @returns The updated comment or null if update failed
 */
export const updateCommentStatus = async (
  commentId: string, 
  status: 'approved' | 'rejected' | 'pending' | 'spam'
): Promise<CommentType | null> => {
  try {
    const response = await api.put(`/comments/${commentId}/status`, { status });
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error updating comment status:', error);
    return null;
  }
};
