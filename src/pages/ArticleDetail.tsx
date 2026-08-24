import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/lib/utils';
import CommentSection from '@/components/CommentSection';
import SEO from '@/components/SEO';
import { useLanguage } from '@/components/LanguageSwitcher';
import { extractTextFromHTML } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { 
  fetchArticleBySlug, 
  fetchRelatedArticles,
  resetFailedEndpoints 
} from '@/utils/api-helper';

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  articleLanguage?: string;
  readingTime?: number;
  author: { _id: string; name: string; avatar?: string; } | string;
  category: { _id: string; name: string; slug: string; } | string;
  createdAt: string;
  updatedAt: string;
}

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const { language } = useLanguage();
  const { toast } = useToast();

  // Sanitize article HTML once (XSS protection)
  const sanitizedContent = useMemo(
    () => (article ? DOMPurify.sanitize(article.content) : ''),
    [article]
  );

  // Function to increment article view count
  const incrementViewCount = async (articleId: string) => {
    try {
      console.log(`Incrementing view count for article: ${articleId}`);
      // Use a try/catch directly with fetch to avoid issues with the API client
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/news/${articleId}/views`;
      
      // Make the fetch request directly instead of using the API client to avoid the variable reference error
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({})
      });
      
      // No need to process the response for view count, we just care that it was called
      if (!response.ok) {
        console.warn(`Failed to increment view count: ${response.status}`);
      }
    } catch (err) {
      console.error('Error incrementing view count:', err);
      // We don't need to show an error to the user for this
    }
  };

  // State to track any errors that occur during API requests
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        console.warn('No slug provided to fetch article');
        setError(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(false);
        setErrorMessage(null);
        
        console.log(`Fetching article with slug: ${slug}`);

        // Use our dedicated helper to fetch the article from real APIs
        const articleData = await fetchArticleBySlug(slug);
        
        if (articleData) {
          // Type guard to ensure we have a valid Article object
          const validArticle = articleData as Article;
          console.log('Successfully fetched article:', validArticle._id);
          setArticle(validArticle);
          
          // Increment the view count for this article
          incrementViewCount(validArticle._id);
          
          // After getting the article, fetch related articles from the same category
          if (validArticle.category && typeof validArticle.category === 'object' && '_id' in validArticle.category) {
            const categoryId = validArticle.category._id;
            console.log(`Fetching related articles for category: ${categoryId}`);
            
            try {
              // Use our dedicated helper for fetching related articles
              const relatedArticlesData = await fetchRelatedArticles(categoryId, validArticle._id);
              
              if (relatedArticlesData && Array.isArray(relatedArticlesData)) {
                // Type guard for related articles
                const typedRelatedArticles = relatedArticlesData as Article[];
                setRelatedArticles(typedRelatedArticles.slice(0, 3));
                console.log(`Found ${typedRelatedArticles.length} related articles`);
              } else {
                console.log('No related articles found or invalid response format');
                setRelatedArticles([]);
              }
            } catch (relatedError) {
              console.error('Unable to fetch related articles:', relatedError);
              // Don't show error toast for this - it's not critical functionality
              setRelatedArticles([]);
            }
          }
        } else {
          console.error('Failed to fetch article - API returned null or undefined');
          setError(true);
          setErrorMessage('The requested article could not be found.');
          toast({
            title: "Article Not Found",
            description: "The requested article could not be found.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(true);
        
        // Check if this is an authentication error
        const errorMessage = err instanceof Error ? err.message : String(err);
        setErrorMessage(errorMessage);
        
        if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.includes('401')) {
          toast({
            title: "Authentication Error",
            description: "You need to be logged in to view this content.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error Loading Article",
            description: errorMessage || "Could not load the article.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, toast]);
  
  // Add a useEffect to log the slug for debugging purposes
  useEffect(() => {
    console.log('Current article slug:', slug);
  }, [slug]);

  // Get author name
  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return 'Unknown Author';
    return author?.name || 'Unknown Author';
  };
  
  // Get category name and slug
  const getCategoryInfo = (category: any) => {
    if (typeof category === 'string') {
      return { name: 'Uncategorized', slug: 'uncategorized' };
    }
    return { name: category?.name || 'Uncategorized', slug: category?.slug || 'uncategorized' };
  };
  
  // Using imported getImageUrl function from utils.ts
  // This handles both Cloudinary URLs and local paths
  
  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM dd, yyyy');
  };

  // Helper function to generate SEO keywords based on article content
  const generateKeywords = () => {
    if (!article) return [];
    
    // Base keywords from article title and category
    const baseKeywords = [];
    
    // Add title-based keywords
    const titleWords = article.title.toLowerCase().split(' ');
    const titleKeywords = titleWords.filter(word => word.length > 3).slice(0, 5); // Use main words from title
    
    // Add category as keyword
    let categoryName = '';
    if (typeof article.category === 'object' && article.category) {
      categoryName = article.category.name.toLowerCase();
    } else if (typeof article.category === 'string') {
      categoryName = article.category.toLowerCase();
    }
    
    // Add author as keyword if available
    let authorName = '';
    if (typeof article.author === 'object' && article.author) {
      authorName = article.author.name.toLowerCase();
    } else if (typeof article.author === 'string') {
      authorName = article.author.toLowerCase();
    }
    
    // Combine all keywords
    return [
      ...baseKeywords, 
      ...titleKeywords,
      categoryName,
      authorName,
      'news',
      'article',
      language === 'hindi' ? 'हिंदी समाचार' : 'english news',
      'mibDaily news'
    ].filter(Boolean); // Remove empty items
  };
  
  // Generate article description for SEO
  const generateDescription = () => {
    if (!article) return '';
    
    // Extract plain text from HTML content for description
    const contentDescription = extractTextFromHTML(article.content, 160);
    
    return contentDescription || article.title;
  };
  
  // Generate properly structured breadcrumbs for the article
  const generateBreadcrumbs = () => {
    if (!article) return [];
    
    const breadcrumbs = [];
    
    // Add category if available (SEO component adds Home automatically)
    if (typeof article.category === 'object' && article.category) {
      breadcrumbs.push({
        name: article.category.name,
        url: `/category/${article.category.slug}`
      });
    }
    
    // Add article title
    breadcrumbs.push({
      name: article.title,
      url: `/article/${article.slug}`
    });
    
    return breadcrumbs;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
        <Skeleton className="h-6 w-1/3 mx-auto mb-8" />
        <Skeleton className="h-[400px] w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage || "The article you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Return to homepage
            </Link>
            <button
              onClick={() => {
                resetFailedEndpoints();
                setError(false);
                setErrorMessage(null);
                // Retry fetching with a slight delay
                setTimeout(() => {
                  if (slug) {
                    setLoading(true);
                    fetchArticleBySlug(slug).then((articleData) => {
                      if (articleData) {
                        setArticle(articleData as Article);
                        toast({
                          title: "Article Retrieved",
                          description: "Successfully loaded the article.",
                          variant: "default"
                        });
                      } else {
                        setError(true);
                        toast({
                          title: "Article Not Found",
                          description: "The article could not be found even after retrying.",
                          variant: "destructive"
                        });
                      }
                      setLoading(false);
                    }).catch(() => {
                      setError(true);
                      setLoading(false);
                    });
                  }
                }, 1000);
              }}
              className="inline-flex items-center px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(article.category);
  const authorName = getAuthorName(article.author);
  const articleImage = article.ogImage || getImageUrl(article.image);
  const articleUrl = article.canonicalUrl || `${import.meta.env.VITE_SITE_URL || window.location.origin}/article/${article.slug}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={article.metaTitle || article.ogTitle || article.title}
        description={article.metaDescription || article.ogDescription || generateDescription()}
        keywords={(article.keywords && article.keywords.length ? article.keywords : generateKeywords())}
        image={articleImage}
        url={articleUrl}
        type="article"
        publishedAt={article.createdAt}
        updatedAt={article.updatedAt}
        author={authorName}
        category={categoryInfo.name}
        readingTime={article.readingTime ? `PT${article.readingTime}M` : undefined}
        breadcrumbs={generateBreadcrumbs()}
      />
      
      {/* Article Header */}
      <div className="text-center mb-8">
        <Link 
          to={`/category/${categoryInfo.slug}`} 
          className="inline-block mb-4"
        >
          <Badge variant="outline" className="bg-primary text-white">
            {categoryInfo.name}
          </Badge>
        </Link>
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <span>By {getAuthorName(article.author)}</span>
          <span>•</span>
          <span>{formatDate(article.createdAt)}</span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="mb-8">
        <img 
          src={getImageUrl(article.image)} 
          alt={article.title} 
          className="w-full max-h-[500px] object-cover rounded-lg shadow-md"
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map(related => (
              <Card key={related._id} className="overflow-hidden">
                <Link to={`/article/${related.slug}`}>
                  <div className="relative h-[200px]">
                    <img 
                      src={getImageUrl(related.image)} 
                      alt={related.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <Badge variant="outline" className="mb-2 bg-primary text-white">
                      {getCategoryInfo(related.category).name}
                    </Badge>
                    <h3 className="font-bold text-lg mb-2">{related.title}</h3>
                    <p className="text-gray-500 text-sm">{formatDate(related.createdAt)}</p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Comments Section */}
      {article && <CommentSection articleId={article._id} />}
    </div>
  );
};

export default ArticleDetail;
