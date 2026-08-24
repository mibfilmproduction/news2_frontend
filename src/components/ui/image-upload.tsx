import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
  existingImageUrl?: string;
  className?: string;
}

// We now use the imported getImageUrl utility function
// This handles both Cloudinary URLs and local paths

export function ImageUpload({ 
  onImageSelected, 
  existingImageUrl = "",
  className = "" 
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(existingImageUrl ? getImageUrl(existingImageUrl) : '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      setPreview("");
      onImageSelected(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelected(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center ${
          isDragging ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
        }`}
        onClick={handleClick}
      >
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
        />
        
        {preview ? (
          <div className="relative w-full">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-[250px] mx-auto object-contain rounded"
            />
            <button 
              className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-400">
              <Upload className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">Drag and drop an image here or click to browse</p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Select Image
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
