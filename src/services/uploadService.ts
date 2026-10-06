import { advertisementApi } from '@/lib/api-client';

/**
 * Upload an image file to Cloudinary through our backend API
 * @param file The image file to upload
 * @param position Optional advertisement position for proper sizing
 * @param size Optional explicit size for dynamic ads: { width, height, sizeMode }
 * @returns Promise with the upload result containing imageUrl and publicId
 */
export const uploadImage = async (
  file: File,
  position?: string,
  size?: { width?: number | null; height?: number | null; sizeMode?: 'preset' | 'custom' }
): Promise<{ imageUrl: string; publicId: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const w = size?.width ? Math.floor(Number(size.width)) : 0;
    const h = size?.height ? Math.floor(Number(size.height)) : 0;
    const custom = size?.sizeMode === 'custom' || (w > 0 && h > 0);

    console.log('Uploading image to Cloudinary:', file.name, position ? `for position: ${position}` : '', custom && w && h ? `custom ${w}x${h}` : '');

    // Use the shared api-client helper with a RELATIVE endpoint.
    // Passing an absolute URL here (VITE_API_URL + path) would get prefixed
    // with API_BASE_URL again inside api.upload(), producing /api/api/...
    // which returns 404.
    const response = await advertisementApi.uploadImage(formData, position, custom ? { width: w || undefined, height: h || undefined, sizeMode: 'custom' } : undefined);

    if (response.success && response.data?.imageUrl) {
      return {
        imageUrl: response.data.imageUrl,
        publicId: response.data.publicId ?? '',
      };
    }

    // Surface the REAL server message (401/403/500 details) instead of a
    // generic error, so the actual cause is visible in the toast + console.
    throw new Error(response.message || 'Upload failed: Invalid response from server');
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(typeof error === 'string' ? error : 'Image upload failed. Please try again.');
  }
};

/**
 * Validate file before upload
 * @param file The file to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSizeInBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is 5MB.`
    };
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
};
