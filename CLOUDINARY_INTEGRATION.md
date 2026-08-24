# Cloudinary Integration for MIIT News

This document provides information on how the Cloudinary integration works in the MIIT News website.

## Overview

The website has been updated to use Cloudinary for image storage instead of local file storage. This provides several benefits:

- Improved scalability and performance
- Automatic image optimizations
- CDN delivery for faster loading
- Advanced image transformations
- Reduced server storage requirements

## Backend Configuration

### Environment Variables

Add the following variables to your `.env` file:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### File Structure

- `backend/config/cloudinary.js` - Configures the Cloudinary SDK with environment variables
- `backend/utils/cloudinaryUpload.js` - Utility functions for uploading and deleting images
- `backend/middleware/uploadMiddleware.js` - Updated to use memory storage for Multer

## How It Works

1. **Article Creation/Update**:
   - The front-end uploads images as before
   - The backend receives the image in memory using Multer
   - The image is sent to Cloudinary
   - Cloudinary returns a URL and public ID
   - The URL is saved in the `image` field of the article
   - The public ID is saved in the `imagePublicId` field for future reference

2. **Image Display**:
   - The front-end uses the `getImageUrl` utility function to handle image URLs
   - This function supports both Cloudinary URLs and local file paths (for backward compatibility)

3. **Image Deletion**:
   - When an article is deleted or its image is replaced, the old image is automatically deleted from Cloudinary using its public ID

## Frontend Integration

The following components have been updated to use Cloudinary:

- `src/lib/utils.ts` - Added the `getImageUrl` utility function
- `src/components/ui/image-upload.tsx` - Updated to properly handle Cloudinary URLs
- `src/pages/ArticleDetail.tsx` - Updated to use the `getImageUrl` utility
- `src/pages/HomePage.tsx` - Updated to use the `getImageUrl` utility

## Testing

To test the Cloudinary integration:

1. Create a new article with an image
2. Verify the image is uploaded to Cloudinary (URL should be a Cloudinary URL)
3. Update the article with a new image
4. Verify the old image is deleted from Cloudinary and the new one is uploaded
5. Delete the article
6. Verify the image is deleted from Cloudinary

## Troubleshooting

If you encounter issues with image uploads:

1. Check your Cloudinary credentials in the `.env` file
2. Verify the connection to Cloudinary is working (check network requests)
3. Look for errors in the server logs
4. Ensure image size is within limits (current max: 5MB)
