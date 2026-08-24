import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Calendar, Upload, X } from "lucide-react";
import dayjs from "dayjs";
import { 
  createAdvertisement, 
  updateAdvertisement,
  Advertisement 
} from "../../services/advertisementService";
import ImageUploader from "./ImageUploader";

interface AdvertisementFormProps {
  advertisement?: Advertisement | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdvertisementForm: React.FC<AdvertisementFormProps> = ({ 
  advertisement, 
  onSuccess, 
  onCancel 
}) => {
  const isEditMode = !!advertisement;
  const navigate = useNavigate();
  
  // Listen for auth events
  useEffect(() => {
    const handleAuthError = () => {
      toast.error('Authentication failed. Please login again.');
      navigate('/login');
    };
    
    // Add event listeners for auth events
    window.addEventListener('auth:unauthorized', handleAuthError);
    window.addEventListener('auth:tokenExpired', handleAuthError);
    
    // Clean up listeners
    return () => {
      window.removeEventListener('auth:unauthorized', handleAuthError);
      window.removeEventListener('auth:tokenExpired', handleAuthError);
    };
  }, [navigate]);
  
  // Initialize form state with Cloudinary support
  const [formData, setFormData] = useState<Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string; publicId?: string }>({
    title: "",
    imageUrl: "",
    targetUrl: "",
    position: "header",
    displayOnPages: ["home"],
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(30, "day").format("YYYY-MM-DD"),
    isActive: true,
    impressions: 0,
    clicks: 0,
    publicId: ""
  });
  
  // Populate form with existing data in edit mode
  useEffect(() => {
    if (advertisement) {
      setFormData({
        ...advertisement,
        // Format dates for input fields
        startDate: dayjs(advertisement.startDate).format("YYYY-MM-DD"),
        endDate: dayjs(advertisement.endDate).format("YYYY-MM-DD")
      });
    }
  }, [advertisement]);

  // Create advertisement mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>) => 
      createAdvertisement(data),
    onSuccess: () => {
      toast.success("Advertisement created successfully");
      onSuccess();
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error("Failed to create advertisement");
        console.error("Create error:", error);
      }
    }
  });

  // Update advertisement mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: Partial<Advertisement> }) => 
      updateAdvertisement(data.id, data.data),
    onSuccess: () => {
      toast.success("Advertisement updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error("Failed to update advertisement");
        console.error("Update error:", error);
      }
    }
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle multi-select changes
  const handlePageSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedPages = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedPages.push(options[i].value);
      }
    }
    
    setFormData(prev => ({ ...prev, displayOnPages: selectedPages }));
  };

  // Handle image upload
  const handleImageUpload = (imageUrl: string, publicId?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      imageUrl,
      // Store publicId if needed for deletion later
      publicId: publicId || prev.publicId
    }));
  };

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.title || !formData.imageUrl || !formData.targetUrl) {
        toast.error("Please fill all required fields");
        return;
      }
      
      // Format dates
      const submissionData = {
        ...formData,
        startDate: dayjs(formData.startDate).toISOString(),
        endDate: dayjs(formData.endDate).toISOString()
      };
      
      if (isEditMode && advertisement?._id) {
        // Update existing advertisement
        // Destructure only the properties we know exist in our type
        const { _id, ...updateData } = submissionData;
        updateMutation.mutate({ id: advertisement._id, data: updateData });
      } else {
        // Create new advertisement
        const { _id, impressions, clicks, ...createData } = submissionData;
        createMutation.mutate(createData);
      }
    } catch (error) {
      toast.error("Error processing form");
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target URL *
            </label>
            <input
              type="url"
              name="targetUrl"
              value={formData.targetUrl}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="header">Header</option>
              <option value="sidebar">Sidebar</option>
              <option value="footer">Footer</option>
              <option value="in-article">In-Article</option>
              <option value="breaking-news">Breaking News</option>
              <option value="category-header">Category Header</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display On Pages *
            </label>
            <select
              name="displayOnPages"
              multiple
              value={formData.displayOnPages}
              onChange={handlePageSelection}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary h-32"
              required
            >
              <option value="home">Home Page</option>
              <option value="category">Category Pages</option>
              <option value="article">Article Pages</option>
              <option value="video">Video Pages</option>
              <option value="live-tv">Live TV</option>
              <option value="short-post">Short Posts</option>
              <option value="trending">Trending Page</option>
              <option value="search">Search Results</option>
              <option value="about">About Page</option>
              <option value="contact">Contact Page</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple pages
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
            </div>
            <div className="ml-2">
              <label className="text-sm font-medium text-gray-700">
                Active
              </label>
              <p className="text-xs text-gray-500">
                Advertisement will be shown if active and within date range
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advertisement Image *
            </label>
            {formData.imageUrl ? (
              <div className="border border-gray-300 rounded-md p-2">
                <div className="relative">
                  <img 
                    src={formData.imageUrl} 
                    alt="Advertisement preview" 
                    className="w-full h-40 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <ImageUploader 
                onUploadComplete={handleImageUpload} 
                position={formData.position} 
              />
            )}
            
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                Recommended dimensions:
                {formData.position === 'header' && ' 970x90px (Leaderboard)'}
                {formData.position === 'sidebar' && ' 300x250px (Medium Rectangle)'}
                {formData.position === 'in-article' && ' 728x90px (In-article)'}
                {formData.position === 'footer' && ' 970x250px (Billboard)'}
                {formData.position === 'breaking-news' && ' 728x90px (Leaderboard)'}
                {formData.position === 'category-header' && ' 970x250px (Billboard)'}
              </p>
            </div>
          </div>
          
          {isEditMode && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Advertisement Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Impressions</p>
                  <p className="text-sm font-medium">{formData.impressions}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Clicks</p>
                  <p className="text-sm font-medium">{formData.clicks}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CTR</p>
                  <p className="text-sm font-medium">
                    {formData.impressions > 0 
                      ? ((formData.clicks / formData.impressions) * 100).toFixed(2) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending 
            ? "Saving..." 
            : isEditMode ? "Update Advertisement" : "Create Advertisement"}
        </button>
      </div>
    </form>
  );
};

export default AdvertisementForm;
