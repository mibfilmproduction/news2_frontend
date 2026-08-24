/**
 * Production API utilities with robust error handling.
 * All calls go directly to the real backend API.
 */

import { api } from '@/lib/api-client';

// Track API endpoints that have failed during the session to avoid retrying them
const failedEndpoints = new Set<string>();

/**
 * Fetches an article by its slug
 * @param slug The article slug to fetch
 * @returns The article data or null if not found
 */
export const fetchArticleBySlug = async (slug: string) => {
  try {
    const response = await api.get(`/news/slug/${slug}`);
    if (response.success && response.data) {
      return response.data;
    }
    console.warn(`Article not found for slug: ${slug}`);
    return null;
  } catch (error) {
    console.error(`Error fetching article by slug ${slug}:`, error);
    return null;
  }
};

/**
 * Fetches related articles by category ID
 * @param categoryId The category ID to fetch related articles for
 * @param excludeArticleId Optional article ID to exclude from results
 * @returns Array of related articles or null if none found
 */
export const fetchRelatedArticles = async (categoryId: string, excludeArticleId?: string) => {
  try {
    const response = await api.get('/news', { category: categoryId, limit: '10' });
    let articles = response.data;
    if (!Array.isArray(articles)) {
      articles = response.data?.data ?? response.data?.articles ?? null;
    }
    if (articles && Array.isArray(articles) && excludeArticleId) {
      return articles
        .filter((article: any) => article._id !== excludeArticleId)
        .slice(0, 3);
    }
    return articles;
  } catch (error) {
    console.error(`Error fetching related articles for category ${categoryId}:`, error);
    return null;
  }
};

/**
 * Fetches comments for an article
 * @param articleId The article ID to fetch comments for
 * @returns Array of comments or null if none found
 */
export const fetchComments = async (articleId: string) => {
  try {
    const response = await api.get(`/comments/article/${articleId}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching comments for article ${articleId}:`, error);
    return null;
  }
};

/**
 * Submits a comment to an article
 * @param articleId The article ID to comment on
 * @param content The comment content
 * @param parentId Optional parent comment ID for replies
 * @returns The submitted comment or null if submission failed
 */
export const submitComment = async (articleId: string, content: string, parentId?: string) => {
  try {
    const commentData = {
      article: articleId,
      content,
      parent: parentId,
    };
    const response = await api.post('/comments', commentData);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`Error submitting comment for article ${articleId}:`, error);
    return null;
  }
};

/**
 * Utility to reset any cached failed endpoints
 * Useful after network conditions change or when retrying operations
 */
export const resetFailedEndpoints = () => {
  failedEndpoints.clear();
  console.log('Reset all failed endpoint caches');
};

/**
 * Checks if there are any failed endpoints cached
 * @returns True if there are failed endpoints, false otherwise
 */
export const hasFailedEndpoints = () => {
  return failedEndpoints.size > 0;
};

/**
 * Helper to determine if a specific API path has failed
 * @param endpoint The endpoint to check
 * @returns True if the endpoint has failed, false otherwise
 */
export const hasEndpointFailed = (endpoint: string) => {
  return failedEndpoints.has(endpoint);
};