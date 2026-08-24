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
import { Loader2, Plus, Pencil, Trash2, Search, MessageCircle } from 'lucide-react';

// Define form schema for short post validation
const shortPostFormSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(280, "Content cannot exceed 280 characters"),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ShortPost type definition
interface ShortPost {
  _id: string;
  content: string;
  image?: string;
  imagePublicId?: string;
  author: {
    _id: string;
    name: string;
  } | string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ShortPosts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shortPosts, setShortPosts] = useState<ShortPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingShortPost, setEditingShortPost] = useState<ShortPost | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [totalShortPosts, setTotalShortPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [shortPostsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<z.infer<typeof shortPostFormSchema>>({
    resolver: zodResolver(shortPostFormSchema),
    defaultValues: {
      content: "",
      tags: "",
      isActive: true,
    }
  });

  // Fetch short posts
  useEffect(() => {
    fetchShortPosts();
  }, [currentPage]);

  const fetchShortPosts = async () => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', shortPostsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await api.get(`/short-posts?${params.toString()}`);
      
      if (response.success) {
        setShortPosts(response.data);
        // Use the count directly from response if available, otherwise calculate
        const count = response.count || response.data.length;
        setTotalShortPosts(count);
        const pages = response.pagination?.pages || 1;
        setTotalPages(pages);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch short posts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching short posts:", error);
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
    fetchShortPosts();
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Open dialog for new short post
  const openNewShortPostDialog = () => {
    setEditingShortPost(null);
    form.reset({
      content: "",
      tags: "",
      isActive: true,
    });
    setSelectedImage(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing short post
  const openEditShortPostDialog = (shortPost: ShortPost) => {
    setEditingShortPost(shortPost);
    form.reset({
      content: shortPost.content,
      tags: shortPost.tags.join(", "),
      isActive: shortPost.isActive,
    });
    setSelectedImage(null);
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setPostToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Delete short post
  const deleteShortPost = async () => {
    if (!postToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await api.delete(`/short-posts/${postToDelete}`);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Short post deleted successfully",
        });
        
        // Refresh the list
        fetchShortPosts();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete short post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting short post:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof shortPostFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Prepare form data for API
      const formData = new FormData();
      formData.append("content", values.content);
      
      if (values.tags) {
        formData.append("tags", values.tags);
      }
      
      formData.append("isActive", values.isActive.toString());
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      
      let response;
      
      if (editingShortPost) {
        // Update existing short post
        if (selectedImage) {
          formData.append("removeImage", "false");
        }
        response = await api.updateWithUpload(`/short-posts/${editingShortPost._id}`, formData);
      } else {
        // Create new short post
        response = await api.upload("/short-posts", formData);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: editingShortPost 
            ? "Short post updated successfully" 
            : "Short post created successfully",
        });
        
        // Close dialog and reset form
        setIsDialogOpen(false);
        setEditingShortPost(null);
        setSelectedImage(null);
        
        // Refresh the list
        fetchShortPosts();
      } else {
        console.error('API error:', response.message);
        toast({
          title: "Error",
          description: response.message || "Failed to save short post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving short post:", error);
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

  // Get author name
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown';
    return author?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Short Posts</h1>
        <Button 
          variant="default" 
          onClick={openNewShortPostDialog} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Short Post
        </Button>
      </div>
      
      <div className="flex items-center justify-between pb-4">
        <div className="relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search short posts..."
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
          {totalShortPosts} total short posts
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7} className="h-16 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : shortPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No short posts found
                </TableCell>
              </TableRow>
            ) : (
              shortPosts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    <Badge variant={post.isActive ? "default" : "outline"}>
                      {post.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate font-medium">
                      {post.content}
                    </div>
                    {post.image && (
                      <div className="mt-1 text-xs text-blue-600">
                        Has image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getAuthorName(post.author)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-xs">
                      <span>👍 {post.likes}</span>
                      <span>💬 {post.comments}</span>
                      <span>🔄 {post.shares}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditShortPostDialog(post)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(post._id)}
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
      
      {/* Create/Edit Short Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingShortPost ? "Edit Short Post" : "Create Short Post"}
            </DialogTitle>
            <DialogDescription>
              {editingShortPost 
                ? "Make changes to your short post here."
                : "Create a new short post to share quick updates."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's happening?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max 280 characters.
                    </FormDescription>
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
                <FormLabel>Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional. Max size 5MB.
                </p>
                
                {editingShortPost?.image && !selectedImage && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Current image:</p>
                    <img
                      src={getImageUrl(editingShortPost.image)}
                      alt="Current"
                      className="h-20 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
                
                {selectedImage && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Selected image:</p>
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="h-20 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
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
                        Only active posts are visible to users.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
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
                  {editingShortPost ? "Update" : "Create"}
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
            <DialogTitle>Delete Short Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this short post?
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
              onClick={deleteShortPost}
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
    </div>
  );
};

export default ShortPosts;
