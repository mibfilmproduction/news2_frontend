import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { getImageUrl } from "@/lib/utils";
import ShortPostsCarousel from "@/components/ShortPostsCarousel";
import ReelsCarousel from "@/components/ReelsCarousel";
import InstagramReels from "@/components/InstagramReels";
import { Separator } from "@/components/ui/separator";
import AdvertisementDisplay from "@/components/AdvertisementDisplay";
import SEO from "@/components/SEO";
import { useLanguage } from "@/components/LanguageSwitcher";

interface Article {
  _id: string;
  title: string;
  slug: string;
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

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<{ [key: string]: Article[] }>({});
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('latest');
  const { language } = useLanguage();

  useEffect(() => {
    // Fetch all articles
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/news');

        if (response.success && response.data) {
          setArticles(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Fetch all categories
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories');

        if (response.success && response.data) {
          setCategories(response.data);

          // For each category, fetch its articles
          const categoryData: { [key: string]: Article[] } = {};

          for (const category of response.data) {
            const articlesResponse = await api.get('/news', { category: category._id });

            if (articlesResponse.success && articlesResponse.data) {
              categoryData[category._id] = articlesResponse.data;
            }
          }

          setCategoryArticles(categoryData);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchArticles();
    fetchCategories();
  }, []);

  // Format the timestamp to a relative time string (e.g., "2 hours ago")
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get category name helper function
  const getCategoryName = (category: any) => {
    if (typeof category === 'string') return 'Uncategorized';
    return category?.name || 'Uncategorized';
  };

  // Using imported getImageUrl function from utils.ts
  // This handles both Cloudinary URLs and local paths

  // Split articles for different sections
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const secondaryArticles = articles.slice(1, 5);
  const regularArticles = articles.slice(5);

  // Render a category section with one big article and related smaller ones
  const renderCategorySection = (categoryId: string, categoryName: string, categorySlug: string) => {
    const categoryArticleList = categoryArticles[categoryId] || [];
    const featuredCategoryArticle = categoryArticleList.length > 0 ? categoryArticleList[0] : null;
    const relatedArticles = categoryArticleList.slice(1, 5);

    if (categoryArticleList.length === 0) return null;

    return (
      <div className="py-8" key={categoryId}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{categoryName}</h2>
          <Link to={`/category/${categorySlug || categoryId}`} className="text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Category Article */}
          {featuredCategoryArticle ? (
            <Card className="md:col-span-2 overflow-hidden">
              <Link to={`/article/${featuredCategoryArticle.slug}`}>
                <div className="relative h-[400px]">
                  <img
                    src={getImageUrl(featuredCategoryArticle.image)}
                    alt={featuredCategoryArticle.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                    <Badge variant="outline" className="bg-primary text-white mb-2">
                      {categoryName}
                    </Badge>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {featuredCategoryArticle.title}
                    </h3>
                    <p className="text-gray-200 text-sm">{formatTimeAgo(featuredCategoryArticle.createdAt)}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ) : (
            <Card className="md:col-span-2 overflow-hidden">
              <Skeleton className="h-[400px] w-full" />
            </Card>
          )}

          {/* Related Articles */}
          <div className="space-y-4">
            {relatedArticles.length > 0 ? (
              relatedArticles.map(article => (
                <Card key={article._id} className="overflow-hidden">
                  <div className="flex flex-row items-center">
                    <div className="w-1/3">
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3 w-2/3">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">
                        <Link to={`/article/${article.slug}`} className="hover:text-primary transition-colors">
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-gray-500 text-xs">{formatTimeAgo(article.createdAt)}</p>
                    </CardContent>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <p>No related articles found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Generate SEO keywords based on categories and article titles
  const generateKeywords = () => {
    const baseKeywords = ['news', 'latest news', 'breaking news', 'india news'];
    
    // Add category names
    const categoryKeywords = categories.map(cat => cat.name.toLowerCase());
    
    // Add trending article keywords (up to 3 titles)
    const articleKeywords = articles.slice(0, 3).map(article => {
      const title = typeof article.title === 'string' ? article.title : '';
      return title.split(' ').slice(0, 3).join(' ').toLowerCase();
    });
    
    // Add language-specific keywords
    const languageKeywords = language === 'hindi' 
      ? ['हिंदी समाचार', 'हिंदी न्यूज़', 'ताज़ा खबर']
      : ['english news', 'indian english news'];
    
    return [...baseKeywords, ...categoryKeywords, ...articleKeywords, ...languageKeywords];
  };
  
  // Generate description based on top articles
  const generateDescription = () => {
    if (articles.length === 0) {
      return language === 'hindi'
        ? 'ताज़ा खबरें, ब्रेकिंग न्यूज़, बॉलीवुड, बिज़नेस, क्रिकेट और राजनीति समाचार हिंदी में पढ़ें Mibnews पर'
        : 'Read latest news, breaking news, politics, business, cricket, entertainment and technology news in English on Mibnews';
    }
    
    // Use the title of the top article in the description
    const topArticle = articles[0];
    const topTitle = typeof topArticle?.title === 'string' ? topArticle.title : '';
    
    return language === 'hindi'
      ? `${topTitle} - ताज़ा खबरें और ब्रेकिंग न्यूज़ हिंदी में पढ़ें Mibnews पर`
      : `${topTitle} - Get the latest breaking news and top stories from India and around the world on Mibnews`;
  };

  return (
    <div className="space-y-10">

      {/* SEO Optimization */}
      
      <SEO
        title="Breaking News, Latest News, Trending Stories | Mibnews"
        description={generateDescription()}
        keywords={generateKeywords()}
        type="website"
        image={articles.length > 0 && articles[0].image ? getImageUrl(articles[0].image) : "/logo.png"}
        breadcrumbs={[]}
      />
      
      {/* Main Advertisement - Only one will be shown across the entire page */}
      <section>
        <div className="mb-6">
          <AdvertisementDisplay position="header" onlyShowOne={true} />
        </div>

      {/* Top Featured Articles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Featured Article */}
        {loading ? (
          <Card className="md:col-span-2 overflow-hidden">
            <Skeleton className="h-[400px] w-full" />
          </Card>
        ) : featuredArticle ? (
          <Card className="md:col-span-2 overflow-hidden">
            <Link to={`/article/${featuredArticle.slug}`}>
              <div className="relative h-[400px]">
                <img
                  src={getImageUrl(featuredArticle.image)}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <Badge variant="outline" className="bg-primary text-white mb-2">
                    {getCategoryName(featuredArticle.category)}
                  </Badge>
                  <h2 className="text-xl md:text-3xl font-bold text-white mb-2">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-gray-200 text-sm">{formatTimeAgo(featuredArticle.createdAt)}</p>
                </div>
              </div>
            </Link>
          </Card>
        ) : (
          <Card className="md:col-span-2 overflow-hidden p-6">
            <p>No articles found. Please check back later.</p>
          </Card>
        )}


        {/* Secondary Articles */}
        <div className="space-y-6">

          {loading ? (
            [...Array(2)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[180px] w-full" />
              </Card>
            ))
          ) :
            secondaryArticles.length > 0 ? (
              secondaryArticles.slice(0, 2).map((article) => (
                <Card key={article._id} className="overflow-hidden">
                  <Link to={`/article/${article.slug}`}>
                    <div className="relative h-[180px]">
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <Badge variant="outline" className="bg-primary text-white mb-2">
                          {getCategoryName(article.category)}
                        </Badge>
                        <h3 className="text-sm md:text-base font-bold text-white mb-1">
                          {article.title}
                        </h3>
                        <p className="text-gray-200 text-xs">{formatTimeAgo(article.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))
            ) : (
              <Card className="overflow-hidden p-4">
                <p>No articles found.</p>
              </Card>
            )}
        </div>

      </div>


      <div className="bg-gray-100 py-10 mt-16 rounded-lg">
        <div className="container mx-auto">
          {/* Featured Reels Section with Carousel */}

          <div className="mb-16">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-2 bg-primary mr-3 rounded-full"></div>
                <h2 className="text-2xl font-bold">Featured Reels</h2>
              </div>
              <Link to="/reels" className="text-primary hover:underline font-medium flex items-center">
                View All <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <ReelsCarousel featured={true} limit={6} />
            </div>

          </div>

          {/* Short Posts Section with Carousel */}
          <div className="mb-16">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-2 bg-red-500 mr-3 rounded-full"></div>
                <h2 className="text-2xl font-bold">Latest Short Posts</h2>
              </div>
              <Link to="/short-posts" className="text-red-500 hover:underline font-medium flex items-center">
                View All <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <ShortPostsCarousel limit={6} />
            </div>

          </div>

          {/* Instagram Reels Section */}
          <div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-2 bg-purple-600 mr-3 rounded-full"></div>
                <h2 className="text-2xl font-bold">Instagram Highlights</h2>
              </div>
              <Link to="/reels" className="text-purple-600 hover:underline font-medium flex items-center">
                Follow Us <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <InstagramReels limit={6} />
            </div>

          </div>
        </div>
      </div>

      {/* Category Header Advertisement */}
      <div className="my-8">
        <AdvertisementDisplay position="category-header" onlyShowOne={true} />
      </div>

      {/* News Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="w-full justify-start border-b rounded-none px-0 mb-6">
          <TabsTrigger value="latest" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Latest News
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Trending
          </TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Most Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[200px] w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : regularArticles.length > 0 ? (
              regularArticles.map((article) => (
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
                      <Badge variant="outline" className="bg-primary text-white mb-2">
                        {getCategoryName(article.category)}
                      </Badge>
                      <h3 className="font-semibold mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{formatTimeAgo(article.createdAt)}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p>No articles found. Please check back later.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[200px] w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : articles.length > 0 ? (
              // We don't have a trending flag yet, so just show different articles
              articles.slice(2, 5).map((article) => (
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
                      <Badge variant="outline" className="bg-primary text-white mb-2">
                        {getCategoryName(article.category)}
                      </Badge>
                      <h3 className="font-semibold mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{formatTimeAgo(article.createdAt)}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p>No trending articles found. Please check back later.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[200px] w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : articles.length > 0 ? (
              // We don't have a popular flag yet, so just show the first articles
              articles.slice(0, 3).map((article) => (
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
                      <Badge variant="outline" className="bg-primary text-white mb-2">
                        {getCategoryName(article.category)}
                      </Badge>
                      <h3 className="font-semibold mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{formatTimeAgo(article.createdAt)}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p>No popular articles found. Please check back later.</p>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
      </section>

      {/* Category Articles Sections */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        {categoriesLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-4">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-[400px] md:col-span-2" />
                  <div className="space-y-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-8">
            {categories.map((category, index) => (
              <div key={category._id} className="category-section">
                {renderCategorySection(category._id, category.name, category.slug)}
                {/* Insert advertisement after every category section */}
                {index % 2 === 1 && (
                  <div className="my-4">
                    <AdvertisementDisplay position="in-article" onlyShowOne={true} />
                  </div>
                )}
                <Separator className="my-8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No categories found.</p>
          </div>
        )}
      </div>

      {/* Footer Advertisement */}
      <div className="mt-12 mb-8">
        <AdvertisementDisplay position="footer" onlyShowOne={true} />
      </div>

    </div>
  );
};

export default HomePage;
