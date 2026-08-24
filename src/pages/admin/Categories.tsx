import { useState, useEffect } from "react";
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
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api-client";

// Define form schema for category validation
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  slug: z.string().min(2, {
    message: "Slug must be at least 2 characters.",
  }),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().optional().default(0),
});

// Interface for Category type
interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  isActive?: boolean;
  displayOrder?: number;
  articlesCount?: number;
  createdAt: string;
  updatedAt: string;
}

const Categories = () => {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  // Watch the name field to auto-generate slug
  const nameField = form.watch("name");
  
  // Auto-generate slug when name changes and slug hasn't been manually edited
  useEffect(() => {
    // Skip auto-generation if we're editing an existing category (which already has a slug)
    if (editingCategory) return;
    
    const currentSlug = form.getValues("slug");
    // Only auto-generate if slug is empty or has not been manually edited
    if (!currentSlug || currentSlug === autoSlugify(form.getValues("name").slice(0, -1))) {
      form.setValue("slug", autoSlugify(nameField));
    }
  }, [nameField, form, editingCategory]);
  
  // Helper to convert a string to a URL-friendly slug
  const autoSlugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')  // Remove non-word chars
      .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
  };
  
  // Fetch categories from API function
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories with article counts already included
      const response = await api.get('/categories', { withCount: 'true' });
      
      if (response.success && Array.isArray(response.data)) {
        // Sort categories by displayOrder, then by name
        const sortedCategories = response.data.sort((a, b) => {
          // First by displayOrder
          if ((a.displayOrder || 0) < (b.displayOrder || 0)) return -1;
          if ((a.displayOrder || 0) > (b.displayOrder || 0)) return 1;
          // Then by name (alphabetically)
          return a.name.localeCompare(b.name);
        });
        
        setCategories(sortedCategories);
      } else {
        setError(response.message || "Failed to fetch categories");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to fetch categories"
        });
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("An unexpected error occurred while fetching categories");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while fetching categories"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories from API when component mounts
  useEffect(() => {
    fetchCategories();
  }, [toast]);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Open dialog for creating a new category
  const openNewCategoryDialog = () => {
    // Clear any errors
    setError(null);
    // Reset editing state
    setEditingCategory(null);
    // Reset form with empty values
    form.reset({
      name: "",
      description: "",
      slug: "",
      isActive: true,
      displayOrder: 0,
    });
    // Clear all validation errors
    form.clearErrors();
    // Open dialog
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing category
  const openEditCategoryDialog = (category: Category) => {
    // Clear any errors
    setError(null);
    
    // Set category to edit
    setEditingCategory(category);
    
    // Reset form with category values - use setTimeout to ensure values are properly applied
    setTimeout(() => {
      form.reset({
        name: category.name,
        description: category.description || "",
        slug: category.slug,
        isActive: category.isActive !== false, // Default to true if undefined
        displayOrder: category.displayOrder || 0,
      });
      
      // Clear all validation errors
      form.clearErrors();
    }, 0);
    
    // Open dialog
    setIsDialogOpen(true);
  };

  // Delete a category
  const handleDeleteCategory = async (id: string) => {
    try {
      setLoading(true);
      
      // Send delete request - the backend will check if category has articles
      const response = await api.delete(`/categories/${id}`);
      
      if (response.success) {
        // Update state
        setCategories(prev => prev.filter(category => category._id !== id));
        
        toast({
          title: "Category Deleted",
          description: "The category has been deleted successfully",
        });
      } else {
        // Check if the error is due to articles using this category
        if (response.articlesCount && response.articlesCount > 0) {
          toast({
            variant: "destructive",
            title: "Cannot Delete Category",
            description: `This category has ${response.articlesCount} article(s) assigned to it. Please reassign or delete those articles first.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to delete category",
          });
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while deleting the category",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Trim input values and ensure slug format is valid
      const formattedValues = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        slug: values.slug.trim().toLowerCase(),
        isActive: values.isActive,
        displayOrder: values.displayOrder || 0
      };
      
      if (editingCategory) {
        // Update existing category
        const response = await api.put(`/categories/${editingCategory._id}`, formattedValues);
        
        if (response.success && response.data) {
          // Create a new array to trigger re-render
          setCategories(prev => prev.map(category => 
            category._id === editingCategory._id 
              ? { ...response.data, articlesCount: category.articlesCount }
              : category
          ));
          
          // Reset form
          form.reset();
          
          toast({
            title: "Success",
            description: `Category "${formattedValues.name}" has been updated.`,
          });
          
          // Close dialog
          setIsDialogOpen(false);
        } else {
          // Handle error
          const errorMessage = response.message || 'Failed to update category';
          setError(errorMessage);
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      } else {
        // Create new category
        const response = await api.post('/categories', formattedValues);
        
        if (response.success && response.data) {
          // Create a new array to trigger re-render
          setCategories(prev => [...prev, { ...response.data, articlesCount: 0 }]);
          
          // Reset form
          form.reset();
          
          toast({
            title: "Success",
            description: `Category "${formattedValues.name}" has been created.`,
          });
          
          // Close dialog
          setIsDialogOpen(false);
        } else {
          // Handle error
          const errorMessage = response.message || 'Failed to create category';
          setError(errorMessage);
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the category';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date string
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={openNewCategoryDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
      
      <div className="flex items-center border rounded-md px-3 w-full max-w-sm">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <Input 
          type="search" 
          placeholder="Search categories..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Loading categories...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive !== false ? "success" : "secondary"}>
                      {category.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.displayOrder || 0}</TableCell>
                  <TableCell>{category.articlesCount || 0}</TableCell>
                  <TableCell>{formatDate(category.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                          <Edit className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteCategory(category._id)}
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
                <TableCell colSpan={8} className="text-center py-8">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          // First set the dialog state
          setIsDialogOpen(open);
          
          // Only do cleanup when dialog is closing
          if (!open) {
            // Clear errors
            setError(null);
            
            // Reset form after slight delay to allow dialog animation
            setTimeout(() => {
              form.reset({
                name: "",
                description: "",
                slug: "",
                isActive: true,
                displayOrder: 0,
              });
              
              // Clear any validation errors
              form.clearErrors();
              
              // Reset editing state
              setEditingCategory(null);
            }, 100);
          } else if (editingCategory) {
            // If opening dialog for editing, ensure values are correctly applied
            setTimeout(() => {
              form.reset({
                name: editingCategory.name,
                description: editingCategory.description || "",
                slug: editingCategory.slug,
                isActive: editingCategory.isActive !== false,
                displayOrder: editingCategory.displayOrder || 0,
              });
            }, 0);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Update the category details below." 
                : "Fill in the details below to create a new category."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Category name" 
                          {...field} 
                          autoFocus
                        />
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
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="category-slug" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL-friendly version of the name (auto-generated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="0"
                          {...field}
                          // Convert string to number since input returns string
                          onChange={e => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value === undefined ? 0 : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Controls the display order in menus (lower numbers appear first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active Category
                        </FormLabel>
                        <FormDescription>
                          Inactive categories won't be shown in the frontend navigation
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || loading}>
                  {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Seed categories button - for development only */}
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={async () => {
            const defaultCategories = [
              { name: "Trending", slug: "trending", description: "Most popular trending news", isActive: true, displayOrder: 1 },
              { name: "Videos", slug: "videos", description: "Video news content", isActive: true, displayOrder: 2 },
              { name: "Photos", slug: "photos", description: "Photo galleries and visual stories", isActive: true, displayOrder: 3 },
              { name: "Live TV", slug: "live-tv", description: "Live television broadcasts", isActive: true, displayOrder: 4 },
              { name: "Web Stories", slug: "web-stories", description: "Interactive web stories", isActive: true, displayOrder: 5 },
              { name: "Cricket", slug: "cricket", description: "Cricket news and updates", isActive: true, displayOrder: 6 },
              { name: "Viral News", slug: "viral-news", description: "News going viral across social media", isActive: true, displayOrder: 7 },
              { name: "Success Stories", slug: "success-stories", description: "Inspiring success stories", isActive: true, displayOrder: 8 },
              { name: "Auto", slug: "auto", description: "Automotive news and reviews", isActive: true, displayOrder: 9 },
              { name: "Mobility", slug: "mobility", description: "Transportation and mobility news", isActive: true, displayOrder: 10 },
              { name: "Latest", slug: "latest", description: "Latest breaking news", isActive: true, displayOrder: 0 },
            ];
            
            setLoading(true);
            try {
              for (const category of defaultCategories) {
                await api.post('/categories', category);
              }
              toast({
                title: "Categories Seeded",
                description: "Default categories have been added",
              });
              // Refresh categories
              fetchCategories();
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to seed categories",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          Seed Default Categories
        </Button>
      )}
    </div>
  );
};

export default Categories;
