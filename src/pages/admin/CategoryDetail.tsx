import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { newsApi, categoryApi } from "@/lib/api";

type Article = {
  _id: string;
  title: string;
  category: string | { _id: string; name: string };
  author: string | { _id: string; name: string };
  status: string;
  createdAt: string;
  viewCount: number;
};

const getAuthorName = (author: Article["author"]): string => {
  if (!author) return "Unknown";
  return typeof author === "string" ? author : author.name || "Unknown";
};

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const categoryRes = await categoryApi.getCategory(categoryId);
      if (categoryRes.success && categoryRes.data) {
        setCategoryName(categoryRes.data.name);
      }

      const res = await newsApi.getArticles({ category: categoryId, limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setArticles(res.data as unknown as Article[]);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching category articles:', error);
      toast({
        title: "Error",
        description: "Failed to load articles for this category.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [categoryId, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await newsApi.deleteArticle(id);
      if (res.success) {
        toast({
          title: "Article deleted",
          description: "The article has been deleted.",
        });
        setArticles(articles.filter(article => article._id !== id));
      } else {
        toast({
          title: "Delete failed",
          description: res.message || "Could not delete the article.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Delete failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = articles.filter(a => a.status === "published").length;
  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Category: {categoryName || categoryId}</h1>
        <Link to="/admin/articles">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Article
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Articles</p>
                <p className="text-3xl font-bold">{articles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-3xl font-bold">{publishedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length > 0 ? (
                articles.map((article) => (
                  <TableRow key={article._id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {article.title}
                    </TableCell>
                    <TableCell>{getAuthorName(article.author)}</TableCell>
                    <TableCell>
                      {article.status === "published" ? (
                        <Badge className="bg-green-500">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{(article.viewCount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to="/admin/articles">
                          <Button size="sm" variant="outline">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500"
                          disabled={deletingId === article._id}
                          onClick={() => handleDelete(article._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No articles found in this category
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;