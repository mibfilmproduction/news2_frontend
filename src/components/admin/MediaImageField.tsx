import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api-client";
import { validateImageFile } from "../../services/uploadService";

interface MediaImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

/**
 * File-only image field for admin forms.
 * Uploads the selected file to the generic media endpoint
 * (POST /api/media/upload) and returns the hosted URL.
 * No manual URL typing.
 */
const MediaImageField: React.FC<MediaImageFieldProps> = ({
  value,
  onChange,
  folder = "mibnews/media",
  label = "Image",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await api.upload<any>("/media/upload", formData);
      const url = response?.data?.url ?? response?.data?.data?.url;

      if (response.success && url) {
        onChange(url);
        toast.success(`${label} uploaded successfully`);
      } else {
        throw new Error(response.message || "Upload failed. Please try again.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      onChange("");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview("");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const preview = value || localPreview;

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="sr-only"
        accept="image/jpeg,image/png,image/jpg,image/webp"
      />

      {preview ? (
        <div className="relative border border-gray-300 rounded-md p-2">
          <img
            src={preview}
            alt={`${label} preview`}
            className="w-full h-40 object-contain"
          />
          {!isUploading && value && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
              title={`Remove ${label.toLowerCase()}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center">
            Click to upload {label.toLowerCase()}
            <br />
            <span className="text-xs">JPG, PNG, WebP up to 5MB</span>
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="mt-2 flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60"
      >
        {isUploading ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {value ? "Change File" : "Upload File"}
          </>
        )}
      </button>
    </div>
  );
};

export default MediaImageField;
