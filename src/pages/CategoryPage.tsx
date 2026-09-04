import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { getImageUrl, extractTextFromHTML } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import SEO from "@/components/SEO";
import { useLanguage } from "@/components/LanguageSwitcher";

interface Article {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  author: string | { _id: string; name: string; };
  category: string | { _id: string; name: string; slug: string; };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 9;
  const { language } = useLanguage();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(false);

        let categoryResponse;
        let articlesResponse;
        let title = '';

        // Handle special categories
        if (slug === 'breaking-news') {
          title = 'Breaking News';
          articlesResponse = await api.get('/news?sort=-createdAt&limit=20&page=1&breaking=true');
        } else if (slug === 'latest-news') {
          title = 'Latest News';
          articlesResponse = await api.get(`/news?sort=-createdAt&limit=${articlesPerPage}&page=${currentPage}`);
        } else {
          // Regular category
          categoryResponse = await api.get(`/categories/slug/${slug}`);
          
          if (categoryResponse.success && categoryResponse.data) {
            setCategory(categoryResponse.data);
            title = categoryResponse.data.name;
            
            // Get articles for this category
            articlesResponse = await api.get(`/news?category=${categoryResponse.data._id}&limit=${articlesPerPage}&page=${currentPage}`);
          } else {
            setError(true);
            return;
          }
        }

        if (articlesResponse && articlesResponse.success) {
          setArticles(articlesResponse.data || []);
          
          // Calculate total pages
          const total = articlesResponse.pagination?.total || 0;
          setTotalPages(Math.ceil(total / articlesPerPage));
          
          // Create a synthetic category for special pages
          if (slug === 'breaking-news' || slug === 'latest-news') {
            setCategory({
              _id: slug,
              name: title,
              slug: slug
            });
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(`Error fetching ${slug} category:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, currentPage]);

  // Format the timestamp to a readable date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMMM dd, yyyy');
  };
  
  // Get category name helper function
  const getCategoryName = (categoryData: any) => {
    if (typeof categoryData === 'string') return 'Uncategorized';
    return categoryData?.name || 'Uncategorized';
  };

  // Get author name helper function
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Staff Reporter';
    return author?.name || 'Staff Reporter';
  };

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mx-auto mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-[200px] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <p className="text-gray-600 mb-6">The category you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-primary hover:underline">Return to homepage</Link>
      </div>
    );
  }

  // Generate SEO keywords for the category page
  const generateKeywords = () => {
    if (!category) return [];
    
    // Base keywords for the category
    const baseKeywords = ['news', category.name.toLowerCase(), `${category.name.toLowerCase()} news`];
    
    // Add language-specific keywords
    const languageKeywords = language === 'hindi' 
      ? [`हिंदी ${category.name.toLowerCase()}`, 'हिंदी समाचार']
      : [`english ${category.name.toLowerCase()} news`, 'indian news'];
    
    // Add keywords from article titles (up to 3)
    const articleKeywords = articles.slice(0, 3).map(article => {
      return article.title.split(' ').slice(0, 2).join(' ').toLowerCase();
    });
    
    return [...baseKeywords, ...languageKeywords, ...articleKeywords, 'mibnews'];
  };
  
  // Generate description for the category
  const generateDescription = () => {
    if (!category) return '';
    
    // Use category description if available
    if (category.description) {
      return category.description;
    }
    
    // Create a description based on the category and articles
    const articleCount = articles.length;
    const categoryName = category.name;
    
    if (articleCount === 0) {
      return language === 'hindi'
        ? `सबसे ताज़ा ${categoryName} समाचार और अपडेट पाएं मिबन्यूज़ पर`
        : `Latest ${categoryName} news, updates and coverage from Mibnews. Stay informed with exclusive stories, analysis, and breaking news.`;
    }
    
    // If we have articles, include the first article title
    const firstArticleTitle = articles[0].title;
    return language === 'hindi'
      ? `${firstArticleTitle} - सबसे ताज़ा ${categoryName} समाचार पाएं मिबन्यूज़ पर`
      : `${firstArticleTitle} - Get the latest ${categoryName} news, updates and expert analysis at Mibnews`;
  };
  
  // Generate breadcrumbs for the category
  const generateBreadcrumbs = () => {
    if (!category) return [];
    
    return [
      { name: 'Home', url: '/' },
      { name: 'Categories', url: '/categories' },
      { name: category.name, url: `/category/${category.slug}` }
    ];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={`${category.name} News | Latest Articles and Updates | Mibnews`}
        description={generateDescription()}
        keywords={generateKeywords()}
        type="website"
        image={articles.length > 0 ? getImageUrl(articles[0].image) : '/logo.jpeg'}
        url={`${window.location.origin}/category/${category.slug}`}
        breadcrumbs={generateBreadcrumbs()}
      />
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 max-w-3xl mx-auto">{category.description}</p>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No articles found in this category.</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Browse other categories</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article._id} className="overflow-hidden">
                <Link to={`/article/${article.slug}`}>
                  <div className="relative h-[200px]">
                    <img
                      src={getImageUrl(article.image)}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline" className="bg-primary text-white">
                        {getCategoryName(article.category)}
                      </Badge>
                      <span className="text-gray-500 text-xs">{formatDate(article.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {article.summary || article.content.replace(/<[^>]*>/g, '').slice(0, 120) + '...'}
                    </p>
                    <p className="text-gray-500 text-xs">By {getAuthorName(article.author)}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                      Previous
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show current page, first, last, and 1 page before and after current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    page === currentPage ||
                    page === currentPage - 1 ||
                    page === currentPage + 1
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
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
                        <span className="flex h-10 w-10 items-center justify-center">
                          ...
                        </span>
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                      Next
                    </PaginationLink>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;
