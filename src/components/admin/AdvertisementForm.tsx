import React, { useState, useEffect, useRef } from "react";
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
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Open the native date picker reliably (the overlay icon must never
  // swallow the click — it is pointer-events-none, and this is a fallback).
  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  };
  
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
  const [formData, setFormData] = useState<Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string; publicId?: string; language?: string }>({
    title: "",
    imageUrl: "",
    targetUrl: "",
    position: "header",
    displayOnPages: ["home"],
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(30, "day").format("YYYY-MM-DD"),
    isActive: true,
    language: "hindi",
    impressions: 0,
    clicks: 0,
    publicId: "",
    sizeMode: "preset",
    customWidth: null as any,
    customHeight: null as any,
  });

  // Persist new-ad text state so refresh/close doesn't wipe it
  useEffect(() => {
    if (advertisement) return;
    const t = setTimeout(() => {
      try {
        const { title, targetUrl, position, displayOnPages, startDate, endDate, isActive, language } = formData as any;
        if (title || targetUrl) {
          localStorage.setItem('draft:advertisement:new', JSON.stringify({ title, targetUrl, position, displayOnPages, startDate, endDate, isActive, language }));
        }
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [formData, advertisement]);

  // Restore draft for new ads
  useEffect(() => {
    if (advertisement) return;
    try {
      const raw = localStorage.getItem('draft:advertisement:new');
      if (raw) {
        const d = JSON.parse(raw);
        if (d && (d.title || d.targetUrl)) {
          setFormData((prev) => ({ ...prev, ...d }));
          toast.success('Unsaved ad draft restored');
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
        toast.error(error.response?.data?.message || error.message || "Failed to create advertisement");
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
        toast.error(error.response?.data?.message || error.message || "Failed to update advertisement");
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
    const selectedPages: string[] = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedPages.push(options[i].value);
      }
    }

    // 'all' is a backend-supported wildcard (matches every page request).
    // Selecting it alongside specific pages is redundant — store just it.
    const pages = selectedPages.includes('all') ? ['all'] : selectedPages;
    setFormData(prev => ({ ...prev, displayOnPages: pages }));
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
      if (!formData.displayOnPages || formData.displayOnPages.length === 0) {
        toast.error("Please select at least one display page");
        return;
      }
      if (dayjs(formData.endDate).isBefore(dayjs(formData.startDate), 'day')) {
        toast.error("End date must be after start date");
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
        try { localStorage.removeItem('draft:advertisement:new'); } catch {}
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
              <option value="category-square">Category Square (200x200)</option>
              <option value="home-hero-side">Home Hero Side - Top Right (same as card)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              name="language"
              value={(formData as any).language || 'hindi'}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Size
            </label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="sizeMode"
                  value="preset"
                  checked={(formData as any).sizeMode !== 'custom'}
                  onChange={() => setFormData(prev => ({ ...prev, sizeMode: 'preset' as any, customWidth: null as any, customHeight: null as any }))}
                />
                Preset (auto per position)
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="sizeMode"
                  value="custom"
                  checked={(formData as any).sizeMode === 'custom'}
                  onChange={() => setFormData(prev => ({ ...prev, sizeMode: 'custom' as any }))}
                />
                Custom (any W x H)
              </label>
            </div>
            {(formData as any).sizeMode === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Width (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={4000}
                    placeholder="e.g. 400"
                    value={(formData as any).customWidth ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customWidth: (e.target.value ? Number(e.target.value) : null) as any }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Height (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={4000}
                    placeholder="e.g. 180"
                    value={(formData as any).customHeight ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customHeight: (e.target.value ? Number(e.target.value) : null) as any }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-500">
                  No forced crop - exact W:H ratio on display. Quick: 970x90, 728x90, 300x600, 300x250, 200x200, 400x180.
                </p>
              </div>
            )}
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
              <option value="all">All Pages (show everywhere)</option>
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
              Hold Ctrl/Cmd to select multiple pages. Choose "All Pages" so the ad shows on home, category, article and every other page.
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
            <div className="relative" onClick={() => openDatePicker(startDateRef)}>
              <input
                ref={startDateRef}
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer date-input-custom-icon"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <div className="relative" onClick={() => openDatePicker(endDateRef)}>
              <input
                ref={endDateRef}
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer date-input-custom-icon"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
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
                customSize={{
                  width: (formData as any).customWidth ?? undefined,
                  height: (formData as any).customHeight ?? undefined,
                  sizeMode: (formData as any).sizeMode,
                }}
              />
            )}
            
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                {(formData as any).sizeMode === 'custom' && (formData as any).customWidth && (formData as any).customHeight
                  ? `Custom size ${(formData as any).customWidth}x${(formData as any).customHeight}px (no forced crop, exact ratio on display)`
                  : 'Recommended dimensions (auto-resized on upload):'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'header' && ' 970x90px (Leaderboard)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'sidebar' && ' 300x600px (Half Page)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'in-article' && ' 970x90px (Strip Banner)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'footer' && ' 728x90px (Leaderboard)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'breaking-news' && ' 300x250px (Medium Rectangle)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'category-header' && ' 728x90px (Leaderboard)'}
                {(formData as any).sizeMode !== 'custom' && formData.position === 'category-square' && ' 200x200px (Square)'}
                {(formData as any).sizeMode !== 'custom' && (formData.position as string) === 'home-hero-side' && ' 400x180px (same as related card)'}
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
