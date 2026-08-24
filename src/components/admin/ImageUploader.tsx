import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { uploadImage, validateImageFile } from "../../services/uploadService";

interface ImageUploaderProps {
  onUploadComplete: (imageUrl: string, publicId?: string) => void;
  defaultImage?: string;
  className?: string;
  position?: string; // Advertisement position for proper sizing
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUploadComplete, 
  defaultImage = "",
  className = "",
  position
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultImage);
  const [uploadSuccess, setUploadSuccess] = useState(!!defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadSuccess(false);
    
    try {
      setIsUploading(true);
      
      // Upload to Cloudinary with position for proper sizing
      const result = await uploadImage(file, position);
      
      // Call the callback with the uploaded image URL
      onUploadComplete(result.imageUrl, result.publicId);
      
      // Show success state
      setUploadSuccess(true);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('', '');
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="sr-only"
        accept="image/jpeg,image/png,image/jpg,image/webp"
      />
      
      {previewUrl ? (
        <div className="relative mb-4 w-full max-w-md">
          <img 
            src={previewUrl}
            alt="Image preview" 
            className="w-full h-auto max-h-64 object-contain rounded-md border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
          {uploadSuccess && (
            <div className="absolute bottom-2 right-2 p-1 bg-green-600 rounded-full text-white">
              <Check size={16} />
            </div>
          )}
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-md p-8 mb-4 w-full max-w-md
                    flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={handleButtonClick}
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center">
            Click to upload an image<br />
            <span className="text-xs">JPG, PNG, WebP up to 5MB</span>
          </p>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`flex items-center px-4 py-2 rounded-md ${previewUrl ? 'bg-gray-200 hover:bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {isUploading ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Change Image' : 'Upload Image'}
          </>
        )}
      </button>
    </div>
  );
};

export default ImageUploader;
