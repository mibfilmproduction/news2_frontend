import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// UI Components
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Play, 
  Film,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define form schema for reel validation
const reelFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// Reel type definition
interface Reel {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  author: {
    _id: string;
    name: string;
  } | string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Reels = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [previewReel, setPreviewReel] = useState<Reel | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [totalReels, setTotalReels] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [reelsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [reelToDelete, setReelToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<z.infer<typeof reelFormSchema>>({
    resolver: zodResolver(reelFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      isActive: true,
      isFeatured: false,
    }
  });

  // Fetch reels and categories on component mount
  useEffect(() => {
    fetchReels();
    fetchCategories();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?active=true');
      
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReels = async () => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', reelsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await api.get(`/reels?${params.toString()}`);
      
      if (response.success) {
        setReels(response.data);
        // Use the count directly from response if available, otherwise calculate
        const count = response.count || response.data.length;
        setTotalReels(count);
        const pages = response.pagination?.pages || 1;
        setTotalPages(pages);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch reels",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReels();
  };

  // Handle file selections
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedVideo(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedThumbnail(e.target.files[0]);
    }
  };

  // Open dialog for new reel
  const openNewReelDialog = () => {
    setEditingReel(null);
    form.reset({
      title: "",
      description: "",
      category: "",
      tags: "",
      isActive: true,
      isFeatured: false,
    });
    setSelectedVideo(null);
    setSelectedThumbnail(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing reel
  const openEditReelDialog = (reel: Reel) => {
    setEditingReel(reel);
    form.reset({
      title: reel.title,
      description: reel.description || "",
      category: typeof reel.category === 'object' ? reel.category._id : reel.category || "",
      tags: reel.tags.join(", "),
      isActive: reel.isActive,
      isFeatured: reel.isFeatured,
    });
    setSelectedVideo(null);
    setSelectedThumbnail(null);
    setIsDialogOpen(true);
  };

  // Open preview dialog
  const openPreviewDialog = (reel: Reel) => {
    setPreviewReel(reel);
    setIsPreviewDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setReelToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Delete reel
  const deleteReel = async () => {
    if (!reelToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await api.delete(`/reels/${reelToDelete}`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Reel deleted successfully",
        });
        
        // Refresh the list
        fetchReels();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete reel",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting reel:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setReelToDelete(null);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof reelFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Prepare form data for API
      const formData = new FormData();
      formData.append("title", values.title);
      
      if (values.description) {
        formData.append("description", values.description);
      }
      
      if (values.category) {
        formData.append("category", values.category);
      }
      
      if (values.tags) {
        formData.append("tags", values.tags);
      }
      
      formData.append("isActive", values.isActive.toString());
      formData.append("isFeatured", values.isFeatured.toString());
      
      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }
      
      if (selectedThumbnail) {
        formData.append("thumbnail", selectedThumbnail);
      }
      
      let response;
      
      if (editingReel) {
        // Update existing reel
        response = await api.updateWithUpload(`/reels/${editingReel._id}`, formData);
      } else {
        // Create new reel
        response = await api.upload("/reels", formData);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: editingReel 
            ? "Reel updated successfully" 
            : "Reel created successfully",
        });
        
        // Close dialog and reset form
        setIsDialogOpen(false);
        setEditingReel(null);
        setSelectedVideo(null);
        setSelectedThumbnail(null);
        
        // Refresh the list
        fetchReels();
      } else {
        console.error('API error:', response.message);
        toast({
          title: "Error",
          description: response.message || "Failed to save reel",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving reel:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format duration to minutes:seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get author name
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown';
    return author?.name || 'Unknown';
  };

  // Get category name
  const getCategoryName = (category: any) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return 'Unknown';
    return category?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Reels</h1>
        <Button 
          variant="default" 
          onClick={openNewReelDialog} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Reel
        </Button>
      </div>
      
      <div className="flex items-center justify-between pb-4">
        <div className="relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search reels..."
                className="w-full pl-8 md:w-[300px] lg:w-[400px]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Button 
                type="submit"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="text-sm text-gray-500">
          {totalReels} total reels
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead className="w-[100px]">Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8} className="h-16 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : reels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No reels found
                </TableCell>
              </TableRow>
            ) : (
              reels.map((reel) => (
                <TableRow key={reel._id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={reel.isActive ? "default" : "outline"}>
                        {reel.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {reel.isFeatured && (
                        <Badge variant="secondary">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="relative h-16 w-28 rounded-md overflow-hidden cursor-pointer"
                      onClick={() => openPreviewDialog(reel)}
                    >
                      <img
                        src={reel.thumbnail ? getImageUrl(reel.thumbnail) : `https://via.placeholder.com/160x90?text=Video`}
                        alt={reel.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate font-medium">
                      {reel.title}
                    </div>
                    {reel.description && (
                      <div className="truncate text-xs text-gray-500">
                        {reel.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDuration(reel.duration)}</TableCell>
                  <TableCell>{getCategoryName(reel.category)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>👁️ {reel.views}</span>
                      <span>👍 {reel.likes}</span>
                      <span>💬 {reel.comments}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(reel.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPreviewDialog(reel)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Preview</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditReelDialog(reel)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(reel._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
            )}
            
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              // Display current page, first, last, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis for gaps
              if (page === 2 || page === totalPages - 1) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            })}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Create/Edit Reel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingReel ? "Edit Video Reel" : "Create Video Reel"}
            </DialogTitle>
            <DialogDescription>
              {editingReel 
                ? "Make changes to your video reel here."
                : "Upload a new video reel to share with your audience."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a title for your video"
                        {...field}
                      />
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
                        placeholder="Enter a description for your video"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="news, sports, tech (comma separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate tags with commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Video File</FormLabel>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a video file. Max size 50MB.
                </p>
              </div>
              
              <div>
                <FormLabel>Thumbnail</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional. Upload a thumbnail image for your video.
                </p>
                
                {editingReel?.thumbnail && !selectedThumbnail && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Current thumbnail:</p>
                    <img
                      src={getImageUrl(editingReel.thumbnail)}
                      alt="Current"
                      className="h-20 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
                
                {selectedThumbnail && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Selected thumbnail:</p>
                    <img
                      src={URL.createObjectURL(selectedThumbnail)}
                      alt="Preview"
                      className="h-20 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active
                        </FormLabel>
                        <FormDescription>
                          Make this video visible to users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Featured
                        </FormLabel>
                        <FormDescription>
                          Show in featured section
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingReel ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Video Reel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this video reel?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={deleteReel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{previewReel?.title || "Video Preview"}</DialogTitle>
          </DialogHeader>
          
          {previewReel && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-md overflow-hidden">
                <video 
                  src={previewReel.videoUrl} 
                  controls 
                  className="w-full h-full"
                  poster={previewReel.thumbnail ? getImageUrl(previewReel.thumbnail) : undefined}
                />
              </div>
              
              {previewReel.description && (
                <p className="text-sm text-gray-700">{previewReel.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {previewReel.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Views: {previewReel.views}</p>
                <p>Likes: {previewReel.likes}</p>
                <p>Comments: {previewReel.comments}</p>
                <p>Created: {formatDate(previewReel.createdAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reels;
