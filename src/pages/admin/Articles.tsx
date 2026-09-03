
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, Search, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getImageUrl } from '@/lib/utils';

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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  
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
  
  const openNewArticleDialog = () => {
    navigate('/admin/articles/new');
  };
  
  const openEditDialog = (article: Article) => {
    navigate(`/admin/articles/${article._id}/edit`);
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
  </div>
);
};

export default Articles;
