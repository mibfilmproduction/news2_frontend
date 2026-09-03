import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the full URL for an image, supporting both Cloudinary and local storage
 * @param imagePath The path or URL of the image
 * @param fallbackImage Optional fallback image if the provided path is empty
 * @returns The complete URL to display the image
 */
export function getImageUrl(imagePath: string | undefined | null, fallbackImage: string = '/placeholder-image.jpg'): string {
  if (!imagePath) return fallbackImage;
  
  // If it's already a complete URL (from Cloudinary or elsewhere), return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // For local paths, use the MEDIA_URL (uploads directory), not API_URL
  const mediaUrl = import.meta.env.VITE_MEDIA_URL || 'http://localhost:5003/uploads';
  return `${mediaUrl}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
}

/**
 * Extract plain text from HTML content for use in meta descriptions and SEO
 * @param htmlContent The HTML content to extract text from
 * @param maxLength Maximum length of the extracted text (default: 160 chars for SEO descriptions)
 * @returns Plain text with HTML tags removed and length constrained
 */
export function extractTextFromHTML(htmlContent: string, maxLength: number = 160): string {
  if (!htmlContent) return '';
  
  // Create temporary div to handle HTML parsing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Get text content without HTML tags
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Remove extra whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to maxLength characters, ending at the last complete word
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
    // Find the last space to avoid cutting words
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > 0) {
      text = text.substring(0, lastSpace);
    }
    text += '...';
  }
  
  return text;
}
