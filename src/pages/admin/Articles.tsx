
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, Search, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, ImageIcon } from "lucide-react";
import { getImageUrl } from '@/lib/utils';

// Define form schema for article validation
const articleFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(20, {
    message: "Content must be at least 20 characters.",
  }),
  summary: z.string().min(10, {
    message: "Summary must be at least 10 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  tags: z.string().optional(),
  articleLanguage: z.enum(["hindi", "english"], {
    required_error: "Please select a language.",
  }),
  slug: z.string().optional(),
  metaTitle: z.string().max(70, {
    message: "Meta title cannot exceed 70 characters.",
  }).optional(),
  metaDescription: z.string().max(160, {
    message: "Meta description cannot exceed 160 characters.",
  }).optional(),
  keywords: z.string().optional(),
  focusKeyword: z.string().optional(),
  canonicalUrl: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  isBreaking: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(["published", "draft"], {
    required_error: "Please select a status.",
  }),
});

// Real article type from database
type Article = {
  _id: string;
  title: string;
  content: string;
  summary: string;
  slug: string;
  image: string;
  category: {
    _id: string;
    name: string;
  };
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  tags: string[];
  articleLanguage: "hindi" | "english";
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  readingTime?: number;
  isBreaking: boolean;
  isFeatured: boolean;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  viewCount: number;
};

// Category type from database
type Category = {
  _id: string;
  name: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  displayOrder?: number;
};

// We now use the getImageUrl function from utils.ts
// This function handles both local paths and Cloudinary URLs

const Articles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(10); // Number of articles per page
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  
  // Helper function for error toasts to maintain consistency
  const showErrorToast = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  };
  
  // Fetch articles and categories when component mounts or search term changes
  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [searchTerm, currentPage]);
  
  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to first page when search term changes
    setCurrentPage(1);
  };
  
  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      // Prepare query parameters for pagination and search
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: articlesPerPage.toString()
      };
      
      // Add search parameter if available
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await api.get('/news', params);

      if (response.success && response.data) {
        setArticles(Array.isArray(response.data) ? response.data : []);
        
        // Handle pagination information
        if (response.pagination) {
          // Use pagination object from the response - get total count from response.count
          setTotalArticles(response.count || 0);
          setTotalPages(response.pagination.pages || 1);
        } else if (typeof response.total === 'number') {
          // Backend returns total count directly
          setTotalArticles(response.total);
          setTotalPages(Math.ceil(response.total / articlesPerPage));
        } else if (Array.isArray(response.data)) {
          // If no pagination info, use the length of returned data
          setTotalArticles(response.data.length);
          setTotalPages(Math.max(1, Math.ceil(response.data.length / articlesPerPage)));
        } else {
          // Fallback case
          setTotalArticles(0);
          setTotalPages(1);
        }
      } else {
        console.error('API error response:', response);
        showErrorToast(response.message || "Failed to fetch articles");
        setArticles([]);
        setTotalArticles(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      showErrorToast("Failed to fetch articles");
      setArticles([]);
      setTotalArticles(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.success && response.data) {
        // Filter out inactive categories and sort by display order
        const activeCategories = response.data
          .filter((cat: Category) => cat.isActive !== false)
          .sort((a: Category, b: Category) => 
            (a.displayOrder || 0) - (b.displayOrder || 0)
          );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Initialize form
  const form = useForm<z.infer<typeof articleFormSchema>>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      category: "",
      tags: "",
      articleLanguage: "hindi",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      isBreaking: false,
      isFeatured: false,
      status: "published",
    },
  });

  // Filter articles based on search term
  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.author?.name && article.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const openNewArticleDialog = () => {
    setEditingArticle(null);
    setSelectedImage(null);
    form.reset({
      title: "",
      content: "",
      summary: "",
      category: "",
      tags: "",
      articleLanguage: "hindi",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      isBreaking: false,
      isFeatured: false,
      status: "published",
    });
    setIsDialogOpen(true);
  };
  
  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    // Reset selected image as we'll use the existing image URL from the article
    setSelectedImage(null);
    
    form.reset({
      title: article.title,
      content: article.content,
      summary: article.summary,
      category: article.category._id,
      tags: article.tags ? article.tags.join(", ") : "",
      articleLanguage: article.articleLanguage || "hindi",
      slug: article.slug || "",
      metaTitle: article.metaTitle || "",
      metaDescription: article.metaDescription || "",
      keywords: article.keywords ? article.keywords.join(", ") : "",
      focusKeyword: article.focusKeyword || "",
      canonicalUrl: article.canonicalUrl || "",
      ogTitle: article.ogTitle || "",
      ogDescription: article.ogDescription || "",
      isBreaking: article.isBreaking,
      isFeatured: article.isFeatured,
      status: article.status,
    });
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await api.delete(`/news/${id}`);
      
      if (response.success) {
        setArticles(articles.filter(article => article._id !== id));
        toast({
          title: "Article deleted",
          description: `Article has been deleted successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete article",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive"
      });
    }
  };
  
  const getStatusBadge = (status: "published" | "draft") => {
    switch(status) {
      case "published":
        return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

const onSubmit = async (values: z.infer<typeof articleFormSchema>) => {
  setIsSubmitting(true);
  
  try {
    const formData = new FormData();
    
    // Add all form values to FormData
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('summary', values.summary);
    formData.append('category', values.category);
    formData.append('articleLanguage', values.articleLanguage);
    formData.append('isBreaking', String(values.isBreaking));
    formData.append('isFeatured', String(values.isFeatured));
    formData.append('status', values.status);
    
    // SEO fields
    if (values.slug && values.slug.trim()) {
      formData.append('slug', values.slug.trim());
    }
    if (values.metaTitle && values.metaTitle.trim()) {
      formData.append('metaTitle', values.metaTitle.trim());
    }
    if (values.metaDescription && values.metaDescription.trim()) {
      formData.append('metaDescription', values.metaDescription.trim());
    }
    if (values.focusKeyword && values.focusKeyword.trim()) {
      formData.append('focusKeyword', values.focusKeyword.trim());
    }
    if (values.canonicalUrl && values.canonicalUrl.trim()) {
      formData.append('canonicalUrl', values.canonicalUrl.trim());
    }
    if (values.ogTitle && values.ogTitle.trim()) {
      formData.append('ogTitle', values.ogTitle.trim());
    }
    if (values.ogDescription && values.ogDescription.trim()) {
      formData.append('ogDescription', values.ogDescription.trim());
    }
    if (values.keywords) {
      const keywordsArray = values.keywords
        .split(',')
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0);
      if (keywordsArray.length > 0) {
        formData.append('keywords', JSON.stringify(keywordsArray));
      }
    }
    
    // Handle tags (convert from comma-separated string to array)
    if (values.tags) {
      const tagsArray = values.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      formData.append('tags', JSON.stringify(tagsArray));
    }
    
    // Add image if selected
    if (selectedImage) {
      formData.append('image', selectedImage);
    } else if (editingArticle && editingArticle.image) {
      // If editing but no new image selected, preserve existing image path
      formData.append('preserveImage', 'true');
    }
    
    let response;
    if (editingArticle) {
      // Update existing article
      console.log('Updating article:', editingArticle._id);
      response = await api.updateWithUpload(`/news/${editingArticle._id}`, formData);
    } else {
      // Create new article
      console.log('Creating new article');
      response = await api.upload('/news', formData);
    }
    
    if (response.success) {
      toast({
        title: editingArticle ? "Article Updated" : "Article Created",
        description: editingArticle 
          ? "The article has been updated successfully."
          : "New article has been created successfully.",
      });
      
      // Reset form and close dialog
      form.reset();
      setIsDialogOpen(false);
      setEditingArticle(null);
      setSelectedImage(null);
      
      // Refresh the article list
      fetchArticles();
    } else {
      console.error('API error:', response.message);
      toast({
        title: "Error",
        description: response.message || "Failed to save article",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error saving article:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Articles</h1>
      <Button 
        variant="default" 
        onClick={openNewArticleDialog} 
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        New Article
      </Button>
    </div>
    
    <div className="flex items-center justify-between pb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search articles..."
          className="w-full pl-8 md:w-[300px] lg:w-[400px]"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
    </div>
    
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Views</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.length > 0 ? (
            articles.map((article) => (
              <TableRow key={article._id}>
                <TableCell className="font-medium max-w-[300px] truncate">
                  <div className="flex items-center space-x-2">
                    {article.image && (
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="h-8 w-8 rounded object-cover"
                        onError={(e) => {
                          // If image fails to load, show a fallback icon
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span>{article.title}</span>
                  </div>
                </TableCell>
                <TableCell>{article.category?.name || 'Uncategorized'}</TableCell>
                <TableCell>{article.author?.name || 'Unknown'}</TableCell>
                <TableCell>{getStatusBadge(article.status || 'draft')}</TableCell>
                <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{article.viewCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(article)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(article._id)}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                {isLoading ? (
                  <div className="flex justify-center items-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      {searchTerm ? `No articles found matching "${searchTerm}".` : "No articles found. Create a new article to get started."}
                    </p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> pages ({' '}
                <span className="font-medium">{totalArticles}</span> articles)
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="mr-2"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // Near the start
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // Near the end
                    pageNum = totalPages - 4 + i;
                  } else {
                    // In the middle
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="mx-1"
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="ml-2"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Article Form Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset form and selected image when dialog closes
            setSelectedImage(null);
            form.reset();
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit Article" : "Create New Article"}</DialogTitle>
            <DialogDescription>
              {editingArticle 
                ? "Make changes to the article here." 
                : "Fill in the details to create a new article."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Article title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the article..."
                        className="h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Article content..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <FormLabel>Featured Image</FormLabel>
                <ImageUpload 
                  onImageSelected={handleImageChange}
                  existingImageUrl={editingArticle ? getImageUrl(editingArticle.image) : ''}
                />
                {editingArticle?.image && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current image: {editingArticle.image.split('/').pop()}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem 
                                key={category._id} 
                                value={category._id}
                                className="flex items-center"
                              >
                                <span>{category.name}</span>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No active categories found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="articleLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="tag1, tag2, tag3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Slug (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="auto-generated if empty" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        e.g. my-article-url-slug
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* SEO Section */}
              <div className="rounded-md border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">SEO Settings</FormLabel>
                  <Badge variant="outline">Search Engine Optimization</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO title (max 70 chars)" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/70 characters
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="focusKeyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Keyword</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary keyword for this article" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="SEO description shown in search results (max 160 chars)"
                          className="h-16"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/160 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/article" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ogTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Title (og:title)</FormLabel>
                        <FormControl>
                          <Input placeholder="Title for social sharing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Description (og:description)</FormLabel>
                        <FormControl>
                          <Input placeholder="Description for social sharing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="isBreaking"
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
                          Breaking News
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this article as breaking news
                        </p>
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
                          Featured Article
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Feature this article on the homepage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingArticle ? "Save Changes" : "Create Article"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Articles;
