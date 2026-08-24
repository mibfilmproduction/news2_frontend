import { ApiResponse } from './api';

// Instagram API Base URL
const INSTAGRAM_API_BASE_URL = 'https://graph.instagram.com/v19.0';

/**
 * Instagram Business API client
 * 
 * This utility handles communication with the Instagram Business API
 * to fetch media from a connected Instagram Business account.
 */
interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
}

interface InstagramResponse<T> {
  data: T[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface FetchReelsOptions {
  accessToken: string;
  userId?: string;
  limit?: number;
  after?: string;
}

/**
 * Fetch Instagram Reels from a connected Instagram Business account
 */
export async function fetchInstagramReels(options: FetchReelsOptions): Promise<ApiResponse<InstagramMedia[]>> {
  try {
    const { accessToken, userId = 'me', limit = 10, after } = options;
    
    // Build the URL with query parameters
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
      limit: limit.toString(),
      ...(after ? { after } : {})
    });
    
    // Make the API request
    const response = await fetch(
      `${INSTAGRAM_API_BASE_URL}/${userId}/media?${params.toString()}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error?.message || 'Failed to fetch Instagram reels',
      };
    }
    
    const data: InstagramResponse<InstagramMedia> = await response.json();
    
    // Filter to only include reels (Instagram API requires additional filtering)
    const reels = data.data.filter(item => 
      // Reels media type is VIDEO and often contains "reel" in the permalink
      item.media_type === 'VIDEO' && item.permalink.includes('reel')
    );
    
    // Properly format the response to match our API structure
    return {
      success: true,
      data: reels,
      pagination: {
        page: 1,
        limit: limit,
        pages: 1,
        total: reels.length,
        cursors: {
          after: data.paging?.cursors?.after,
          before: data.paging?.cursors?.before,
        },
        hasNextPage: !!data.paging?.next
      }
    };
  } catch (error) {
    console.error('Error fetching Instagram reels:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Transform Instagram media data to match our application's Reel format
 */
export function transformInstagramToReel(instagramMedia: InstagramMedia) {
  return {
    _id: `instagram_${instagramMedia.id}`,
    title: instagramMedia.caption?.slice(0, 50) || 'Instagram Reel',
    description: instagramMedia.caption || '',
    videoUrl: instagramMedia.media_url,
    thumbnail: instagramMedia.thumbnail_url || '',
    externalUrl: instagramMedia.permalink,
    author: {
      _id: 'instagram',
      name: instagramMedia.username
    },
    isExternal: true,
    platform: 'instagram',
    createdAt: instagramMedia.timestamp,
    updatedAt: instagramMedia.timestamp,
    views: 0,
    likes: 0,
    comments: 0,
    isActive: true,
    isFeatured: false,
    tags: []
  };
}
