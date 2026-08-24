
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Download, Edit, Loader2, MoreHorizontal, Play, Plus, RefreshCw, Search, Shield, Trash, Upload } from "lucide-react";
import { getVideos, createVideo, updateVideo, deleteVideo, VideoType } from "@/services/videoService";
import { getCategories, CategoryType } from "@/services/categoryService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useAuth from "@/hooks/useAuth";

// Define form schema for video validation
const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  video: z.instanceof(File).optional(),
  keepExistingVideo: z.boolean().default(true),
  thumbnail: z.instanceof(File).optional(),
  keepExistingThumbnail: z.boolean().default(true),
  duration: z.string().regex(/^\d+:\d{2}(:\d{2})?$/, {
    message: "Duration must be in format MM:SS or HH:MM:SS",
  }),
  categoryId: z.string(),
  categoryName: z.string().optional(),
  language: z.enum(["hindi", "english"]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// Video type is imported from videoService

// Function to fetch categories from the backend
const fetchCategories = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`);
    const data = await response.json();
    return data.map((cat: any) => ({ id: cat._id, name: cat.name }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const Videos = () => {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenRefreshed, setTokenRefreshed] = useState<boolean>(false);
  
  // Authentication
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  // File upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<{[key: string]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Separate fetch functions for videos and categories
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Force refresh from the server and use admin flag for dashboard data
      // For admin use - fetch all videos, no need to filter by language initially
      const response = await getVideos('hindi', 1, 100, undefined, true);

      // Standard response handling
      if (response && Array.isArray(response.videos)) {
        setVideos(response.videos);
        return true;
      } 
      
      // Try to extract videos if the response structure is unexpected
      if (response && typeof response === 'object') {
        // Check if response itself is an array of videos
        if (Array.isArray(response)) {
          setVideos(response);
          return true;
        }
        
        // Check for any property that might contain videos
        for (const key in response) {
          if (Array.isArray(response[key])) {
            setVideos(response[key]);
            return true;
          }
        }
      }
      
      // Fall back to empty array if nothing found
      setVideos([]);
      return false;
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      setError(error.message || 'Could not load videos. Please check if the backend server is running.');
      
      // For debugging only - show error on screen
      toast({
        title: "API Error",
        description: error.message || 'Video loading failed',
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    
    try {
      // Use our new categoryService to fetch categories in simple format
      const cats = await getCategories({ format: 'simple' });
      
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
        return true;
      } else if (Array.isArray(cats) && cats.length === 0) {
        setCategoryError('No categories found. Please create a category first.');
        return false;
      } else {
        throw new Error('Invalid category data received');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategoryError(error.message || 'Could not load categories. Please check your connection.');
      
      toast({
        title: "Category Loading Error",
        description: "Categories could not be loaded. Some features may be limited.",
        variant: "destructive"
      });
      return false;
    } finally {
      setCategoryLoading(false);
    }
  };
  
  // Function to refresh categories
  const refreshCategories = async () => {
    await fetchCategories();
    toast({
      title: "Categories refreshed", 
      description: categoryError ? "Error: " + categoryError : "Categories have been refreshed"
    });
  };
  
  // Check authentication first
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin dashboard",
        variant: "destructive"
      });
      navigate('/login');
    } else if (!isAdmin) {
      toast({
        title: "Admin Access Required",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate, toast]);

  // Save and validate token to ensure it persists and is valid
  useEffect(() => {
    if (user?.token) {
      // Store token in both storages for consistent access
      sessionStorage.setItem('token', user.token);
      localStorage.setItem('token', user.token);
    } else {
      // If no user token in context, check if we have one in storage
      const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      // If no token found anywhere, we might have an auth issue
      if (!storedToken && (isAuthenticated || isAdmin)) {
        setAuthError("Token missing. Please log in again.");
      }
    }
  }, [user, isAuthenticated, isAdmin]);
  
  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive"
      });
      // Clear any invalid tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [authError, toast, navigate]);
  
  // Fetch videos and categories on component mount and when refreshed
  useEffect(() => {
    // Check for token in sessionStorage (handles page refresh cases)
    const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    // Load data if authenticated as admin or if token exists in storage
    if ((isAuthenticated && isAdmin) || storedToken) {
      const loadData = async () => {
        try {
          // Check if we have videos data already
          if (videos.length === 0) {
            await fetchVideos();
          }
        
        // Check if we have categories data already
        if (categories.length === 0) {
          await fetchCategories();
        }
        } catch (error: any) {
          console.error('Error loading data:', error);
          // Check if error is authentication related (401)
          if (error?.response?.status === 401) {
            setAuthError('Your session has expired. Please login again.');
          } else {
            setError('Failed to load data. Please try again.');
          }
        }
      };
      
      loadData();
      
      // Set up retry for failed data loads
      const retryInterval = setInterval(() => {
        if (error || videos.length === 0) fetchVideos();
        if (categoryError || categories.length === 0) fetchCategories();
      }, 20000); // Retry every 20 seconds if there were errors or no data
      
      return () => clearInterval(retryInterval);
    }
  }, [isAuthenticated, isAdmin, videos.length, categories.length, error, categoryError]);  // Run when auth state or data availability changes

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      categoryId: "",
      categoryName: "",
      language: "hindi",
      isActive: true,
      isFeatured: false,
      keepExistingVideo: true,
      keepExistingThumbnail: true,
    },
  });

  // Filter videos based on search term
  const filteredVideos = videos.filter(video => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      video.title.toLowerCase().includes(search) ||
      (video.description?.toLowerCase() || '').includes(search) ||
      video.categoryName.toLowerCase().includes(search)
    );
  });
  
  // Debug logs
  console.log('Filtered videos count:', filteredVideos.length);

  const openNewVideoDialog = () => {
    setEditingVideo(null);
    setVideoFile(null);
    setThumbnailFile(null);
    form.reset({
      title: "",
      description: "",
      duration: "",
      categoryId: "",
      categoryName: "",
      language: "hindi",
      isActive: true,
      isFeatured: false,
      keepExistingVideo: true,
      keepExistingThumbnail: true,
    });
    setIsDialogOpen(true);
  };

  const openEditVideoDialog = (video: VideoType) => {
    setEditingVideo(video);
    setVideoFile(null);
    setThumbnailFile(null);
    
    // Find the matching category
    const categoryId = typeof video.category === 'string' ? video.category : video.category?._id;
    const categoryObj = categories.find(cat => cat.id === categoryId || cat._id === categoryId);
    
    form.reset({
      title: video.title,
      description: video.description || "",
      duration: video.duration,
      categoryId: categoryId || "",
      categoryName: video.categoryName || categoryObj?.name || "",
      language: video.language || "hindi",
      isActive: video.isActive,
      isFeatured: video.isFeatured,
      keepExistingVideo: true,
      keepExistingThumbnail: true,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      setVideos(videos.filter(video => video._id !== id));
      toast({
        title: "Video deleted",
        description: "The video has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete the video. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleFeaturedVideo = async (id: string) => {
    const video = videos.find(v => v._id === id);
    if (!video) return;
    
    try {
      const formData = new FormData();
      formData.append('title', video.title);
      formData.append('isFeatured', (!video.isFeatured).toString());
      if (video.description) formData.append('description', video.description);
      formData.append('duration', video.duration);
      formData.append('categoryId', typeof video.category === 'string' ? video.category : video.category?._id || '');
      formData.append('categoryName', video.categoryName || '');
      formData.append('language', video.language || 'hindi');
      formData.append('isActive', video.isActive.toString());
      
      const updatedVideo = await updateVideo(id, formData);
      
      setVideos(videos.map(v => v._id === id ? updatedVideo : v));
      
      toast({
        title: !video.isFeatured ? "Added to featured" : "Removed from featured",
        description: `"${video.title}" has been ${!video.isFeatured ? "added to" : "removed from"} featured videos.`,
      });
    } catch (error) {
      console.error('Error updating video featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update the video. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadError(null);
    setAuthError(null);
    
    // Make sure the user is authenticated and admin
    if (!isAuthenticated || !isAdmin) {
      setAuthError("You must be logged in as an admin to perform this action");
      toast({
        title: "Authentication Error",
        description: "Please log in with admin credentials",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Ensure the token is available
    const token = user?.token || localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setAuthError("Authentication token not found. Please log in again.");
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add the form fields to FormData
      formData.append('title', values.title);
      if (values.description) formData.append('description', values.description);
      formData.append('duration', values.duration);
      
      // Validate category - show error if not selected
      if (!values.categoryId) {
        toast({
          title: "Missing category",
          description: "Please select a category for the video.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      formData.append('categoryId', values.categoryId);
      
      // Get category name from selected category ID
      const selectedCategory = categories.find(cat => cat.id === values.categoryId || cat._id === values.categoryId);
      const categoryName = selectedCategory?.name || values.categoryName || "";
      formData.append('categoryName', categoryName);
      
      formData.append('language', values.language);
      formData.append('isActive', values.isActive.toString());
      formData.append('isFeatured', values.isFeatured.toString());
      
      // If editing, include the ID and handle existing media flags
      if (editingVideo) {
        formData.append('id', editingVideo._id);
        formData.append('keepExistingVideo', values.keepExistingVideo.toString());
        formData.append('keepExistingThumbnail', values.keepExistingThumbnail.toString());
      } else if (!videoFile || !thumbnailFile) {
        // Require both files for new videos
        toast({
          title: "Missing files",
          description: "Please upload both a video file and thumbnail image.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Add files if they exist
      if (videoFile && (!editingVideo || !values.keepExistingVideo)) {
        formData.append('video', videoFile);
      }
      
      if (thumbnailFile && (!editingVideo || !values.keepExistingThumbnail)) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Configure progress tracking
      const progressCallback = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(percentCompleted);
      };

      if (editingVideo) {
        // Update existing video
        await updateVideo(editingVideo._id, formData, progressCallback);
        await fetchVideos();
        
        toast({
          title: "Video updated",
          description: `"${values.title}" has been updated successfully.`,
        });
      } else {
        // Create new video
        await createVideo(formData, progressCallback);
        await fetchVideos();
        
        toast({
          title: "Video added",
          description: `"${values.title}" has been added successfully.`,
        });
      }
      
      // Reset file inputs and state
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
      setIsSubmitting(false);
      setUploadError(null);
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving video:', error);
      
      // Display more detailed error message based on the error type
      const errorMessage = error.message || "Failed to save the video. Please try again.";
      setUploadError(errorMessage);
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setIsSubmitting(false);
    }
  };
  
  // File input handlers
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video file must be smaller than 100MB. Please select a smaller file.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid video file.",
          variant: "destructive"
        });
        return;
      }
      
      setVideoFile(file);
      form.setValue('keepExistingVideo', false);
    }
  };
  
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Thumbnail image must be smaller than 5MB. Please select a smaller file.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file for the thumbnail.",
          variant: "destructive"
        });
        return;
      }
      
      setThumbnailFile(file);
      form.setValue('keepExistingThumbnail', false);
    }
  };

  // Function to extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to download video
  const handleDownloadVideo = async (video: VideoType) => {
    try {
      setDownloadLoading(prev => ({ ...prev, [video._id]: true }));
      
      // Get the video URL from the video object
      const videoUrl = video.videoUrl;
      
      if (!videoUrl) {
        toast({
          title: "Error",
          description: "Video URL not available",
          variant: "destructive"
        });
        return;
      }
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      
      // Append to the document body
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `${video.title} is downloading`,
      });
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: "Error",
        description: "Failed to download the video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(prev => ({ ...prev, [video._id]: false }));
    }
  };

  // Filter videos based on search term - function now handles both title and description
  // Debug logs for troubleshooting
  console.log('Total videos loaded:', videos.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Videos ({videos.length})</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={openNewVideoDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Video
          </Button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search videos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={async () => {
            setLoading(true);
            await fetchVideos();
            toast({
              title: "Data Refreshed",
              description: "Video data has been refreshed"
            });
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
        
        {/* For testing - load sample data */}
        <Button 
          variant="outline" 
          onClick={() => {
            // Sample data for testing
            setVideos([
              {
                _id: '1',
                title: 'Demo Video 1',
                description: 'This is a demo video for testing',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnail: 'https://via.placeholder.com/600x400',
                duration: '3:45',
                categoryName: 'News',
                category: 'news-cat',
                author: 'Admin',
                views: 100,
                language: 'hindi',
                videoLanguage: 'hindi', // Added to match updated schema
                tags: ['news', 'demo'],
                isActive: true,
                isFeatured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                _id: '2',
                title: 'Demo Video 2',
                description: 'Another demo video for testing',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnail: 'https://via.placeholder.com/600x400',
                duration: '2:30',
                categoryName: 'Sports',
                category: 'sports-cat',
                author: 'Admin',
                views: 50,
                language: 'english',
                videoLanguage: 'english', // Added to match updated schema
                tags: ['sports', 'demo'],
                isActive: true,
                isFeatured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]);
            setLoading(false);
            toast({
              title: "Sample Data Loaded",
              description: "Demo videos have been loaded for testing"
            });
          }}
        >
          <Shield className="mr-2 h-4 w-4" /> Load Sample Data
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading videos...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-destructive">
          <p>{error}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos && filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <Card key={video._id} className="overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-80" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  {video.isFeatured && (
                    <Badge variant="success" className="absolute top-2 left-2">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="info" className="absolute top-2 right-2">
                    {video.views} views
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold truncate">{video.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{video.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditVideoDialog(video)}>
                          <Edit className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFeaturedVideo(video._id)}>
                          <span className="mr-2">⭐</span>
                          {video.isFeatured ? "Remove from Featured" : "Add to Featured"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDownloadVideo(video)}
                        >
                          <Download className="mr-2 h-4 w-4" />Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteVideo(video._id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-between text-xs">
                    <Badge variant="outline">{video.categoryName}</Badge>
                    <span className="text-gray-500">{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No videos found
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Force render test data if no videos */}
              {filteredVideos && filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <TableRow key={video._id}>
                    <TableCell>
                      <div className="relative h-12 w-20 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={video.thumbnail || 'https://via.placeholder.com/160x90?text=No+Thumbnail'}
                          alt={video.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x90?text=Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                          <Play className="h-5 w-5 text-white opacity-80" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-[8px] px-1">
                          {video.duration}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {video.title}
                    </TableCell>
                    <TableCell>{video.categoryName}</TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>{video.views}</TableCell>
                    <TableCell>
                      {video.isFeatured ? (
                        <Badge variant="success">Featured</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(video.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditVideoDialog(video)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeaturedVideo(video._id)}>
                            <span className="mr-2">⭐</span>
                            {video.isFeatured ? "Remove from Featured" : "Add to Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadVideo(video)}
                          >
                            <Download className="mr-2 h-4 w-4" />Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteVideo(video._id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No videos found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}


      {/* Video Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
            <DialogDescription>
              {editingVideo 
                ? "Make changes to the video details here." 
                : "Add a new video to the gallery."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Authentication Error Alert */}
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>
                    {authError}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal underline ml-2" 
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/login');
                      }}
                    >
                      Log in again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Category Info/Error Alert */}
              {categoryError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Category Error</AlertTitle>
                  <AlertDescription>
                    {categoryError}. 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal underline" 
                      onClick={(e) => {
                        e.preventDefault();
                        refreshCategories();
                      }}
                    >
                      Retry loading categories
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Video title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the video"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Video Upload Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Video Upload {!editingVideo && <span className="text-red-500">*</span>}</label>
                  <div className="flex flex-col gap-2">
                    <div className={`border rounded-md p-4 text-center cursor-pointer hover:bg-muted transition-colors ${!editingVideo && !videoFile ? 'border-red-300 bg-red-50' : ''}`}>
                      <input 
                        type="file" 
                        accept="video/*" 
                        id="video-upload" 
                        className="hidden" 
                        onChange={handleVideoFileChange}
                      />
                      <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6" />
                        <span>{videoFile ? videoFile.name : 'Select Video File'}</span>
                        {videoFile && (
                          <span className="text-xs text-gray-500">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </label>
                    </div>
                    {!editingVideo && !videoFile && (
                      <p className="text-xs text-red-500">Video file is required</p>
                    )}
                    {editingVideo && (
                      <FormField
                        control={form.control}
                        name="keepExistingVideo"
                        render={({ field }) => (
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="keepVideo" 
                              checked={field.value} 
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                            <label htmlFor="keepVideo" className="text-sm">Keep existing video if no new file selected</label>
                          </div>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="MM:SS or HH:MM:SS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Thumbnail Upload Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Thumbnail Upload {!editingVideo && <span className="text-red-500">*</span>}</label>
                <div className="flex flex-col gap-2">
                  <div className={`border rounded-md p-4 text-center cursor-pointer hover:bg-muted transition-colors ${!editingVideo && !thumbnailFile ? 'border-red-300 bg-red-50' : ''}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="thumbnail-upload" 
                      className="hidden" 
                      onChange={handleThumbnailFileChange}
                    />
                    <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6" />
                      <span>{thumbnailFile ? thumbnailFile.name : 'Select Thumbnail Image'}</span>
                      {thumbnailFile && (
                        <span className="text-xs text-gray-500">
                          {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                    </label>
                  </div>
                  {!editingVideo && !thumbnailFile && (
                    <p className="text-xs text-red-500">Thumbnail image is required</p>
                  )}
                  {editingVideo && (
                    <FormField
                      control={form.control}
                      name="keepExistingThumbnail"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="keepThumbnail" 
                            checked={field.value} 
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <label htmlFor="keepThumbnail" className="text-sm">Keep existing thumbnail if no new file selected</label>
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>
              
              {/* Category and Language Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            refreshCategories();
                          }}
                          disabled={categoryLoading}
                          className="h-6 px-2"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${categoryLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                          disabled={categories.length === 0 || categoryLoading}
                        >
                          <option value="" disabled>{categoryLoading ? 'Loading categories...' : categories.length === 0 ? 'No categories available' : 'Select a category'}</option>
                          {categories.map(category => (
                            <option key={category.id || category._id} value={category.id || category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                      {categoryLoading ? (
                        <p className="text-blue-500 text-xs mt-1 flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
                          Loading categories...
                        </p>
                      ) : categories.length === 0 && (
                        <p className="text-amber-500 text-xs mt-1">No categories available. Please create categories first.</p>
                      )}
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hindi">हिंदी</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Status Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel>Active (visible to users)</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel>Featured Video</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Preview section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Preview Thumbnail if available */}
                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnail Preview</label>
                  <div className="h-40 w-full rounded-md overflow-hidden bg-gray-100">
                    {thumbnailFile ? (
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                    ) : editingVideo?.thumbnail ? (
                      <img
                        src={editingVideo.thumbnail}
                        alt="Current thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No thumbnail selected</p>
                       
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                <div>
                  <label className="block text-sm font-medium mb-1">Video Preview</label>
                  <div className="h-40 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {videoFile ? (
                      <video 
                        src={URL.createObjectURL(videoFile)} 
                        className="h-full w-full object-contain" 
                        controls 
                      />
                    ) : editingVideo?.videoUrl ? (
                      editingVideo.videoUrl.includes('youtube.com') || editingVideo.videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={editingVideo.videoUrl}
                          title="YouTube video player"
                          className="h-full w-full object-cover"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video 
                          src={editingVideo.videoUrl} 
                          className="h-full w-full object-contain" 
                          controls 
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Play className="h-8 w-8 mb-2" />
                        <p>No video selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Upload Progress Display */}
              {isSubmitting && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Uploading {uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Please wait while your video is being uploaded...</p>
                </div>
              )}
              
              {/* Upload Error Message */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Processing...'}
                    </span>
                  ) : editingVideo ? "Save Changes" : "Add Video"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Videos;
