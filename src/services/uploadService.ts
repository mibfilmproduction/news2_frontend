import { api } from '@/lib/api-client';

/**
 * Upload an image file to Cloudinary through our backend API
 * @param file The image file to upload
 * @param position Optional advertisement position for proper sizing
 * @returns Promise with the upload result containing imageUrl and publicId
 */
export const uploadImage = async (file: File, position?: string): Promise<{ imageUrl: string; publicId: string }> => {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('image', file);
    
    console.log('Uploading image to Cloudinary:', file.name, position ? `for position: ${position}` : '');
    
    // We need to bypass the api client for FormData uploads as it's configured for JSON
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').token : null;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Build URL with position query parameter if provided
    let uploadUrl = `${apiUrl}/advertisements/upload-image`;
    if (position) {
      uploadUrl += `?position=${encodeURIComponent(position)}`;
    }
    
    // Send the FormData directly without processing/stringifying it
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
    }
    
    const response = await res.json();
    console.log('Cloudinary upload response:', response);
    
    // Handle backend response structure
    if (response.status === 'success' && response.data) {
      return {
        imageUrl: response.data.imageUrl,
        publicId: response.data.publicId
      };
    } else if (response.success && response.data) {
      return {
        imageUrl: response.data.imageUrl,
        publicId: response.data.publicId || ''
      };
    }
    
    throw new Error('Upload failed: Invalid response from server');
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 * @param file The file to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is 5MB.`
    };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
};
