import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { getImageUrl, optimizeImageUrl } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";
import { useLanguage } from "@/components/LanguageSwitcher";

// Below-fold / heavy widgets load AFTER first paint — keeps LCP + TBT low
const ShortPostsCarousel = lazy(() => import("@/components/ShortPostsCarousel"));
const ReelsCarousel = lazy(() => import("@/components/ReelsCarousel"));
const InstagramReels = lazy(() => import("@/components/InstagramReels"));
const AdvertisementDisplay = lazy(() => import("@/components/AdvertisementDisplay"));
const TopInfoSlider = lazy(() => import("@/components/TopInfoSlider"));

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
    // Fetch latest articles only (limit keeps payload + LCP in check)
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/news', { limit: 12 });

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

    // Fetch all categories + their articles dynamically
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories', { active: 'true' });

        if (response.success && response.data) {
          // Only active categories, in backend sort order (sortOrder, name).
          // Falls back to client-side filter in case backend ignores the param.
          const allCategories: Category[] = (response.data as Category[]).filter(
            (cat) => (cat as any)?.isActive !== false
          );
          setCategories(allCategories);

          // Fetch articles for EVERY category in parallel (no slice limit),
          // so newly added categories appear automatically.
          // Individual failures resolve to [] so one bad category
          // doesn't break the whole homepage.
          const results: Array<[string, Article[]]> = await Promise.all(
            allCategories.map(async (category): Promise<[string, Article[]]> => {
              try {
                const articlesResponse = await api.get('/news', { category: category._id, limit: 5 });
                if (articlesResponse.success && Array.isArray(articlesResponse.data)) {
                  return [category._id, articlesResponse.data as Article[]];
                }
              } catch (err) {
                console.error(`Error fetching articles for category ${category._id}:`, err);
              }
              return [category._id, [] as Article[]];
            })
          );

          const categoryData: { [key: string]: Article[] } = {};
          for (const [categoryId, list] of results) {
            categoryData[categoryId] = list;
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

  // Render a category section with one big article and related smaller ones.
  // Categories that show ads below them (every 2nd) display only 2 related
  // articles, and the freed-up space in the right column is filled with a
  // square ad so the layout stays balanced.
  const renderCategorySection = (
    categoryId: string,
    categoryName: string,
    categorySlug: string,
    relatedLimit = 4,
    squareAdSlot: number | null = null,
  ) => {
    const categoryArticleList = categoryArticles[categoryId] || [];
    const featuredCategoryArticle = categoryArticleList.length > 0 ? categoryArticleList[0] : null;
    const relatedArticles = categoryArticleList.slice(1, 1 + relatedLimit);

    if (categoryArticleList.length === 0) return null;

    return (
      <div className="py-1 sm:py-1.5" key={categoryId}>
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <h2 className="text-base sm:text-2xl font-bold">{categoryName}</h2>
          <Link to={`/category/${categorySlug || categoryId}`} className="text-primary hover:underline text-xs sm:text-base">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-stretch">
          {/* Featured Category Article */}
          {featuredCategoryArticle ? (
            <Card className="col-span-2 overflow-hidden flex flex-col">
              <Link to={`/article/${featuredCategoryArticle.slug}`} className="flex flex-1 flex-col">
                <div className="relative flex-1 min-h-[140px] sm:min-h-0 sm:h-[400px]">
                  <img
                    src={optimizeImageUrl(getImageUrl(featuredCategoryArticle.image), 800)}
                    alt={featuredCategoryArticle.title}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 sm:p-6">
                    <Badge variant="outline" className="bg-primary text-white mb-1 sm:mb-2 text-[10px] sm:text-sm">
                      {categoryName}
                    </Badge>
                    <h3 className="text-xs sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-3">
                      {featuredCategoryArticle.title}
                    </h3>
                    <p className="text-gray-200 text-[10px] sm:text-sm">{formatTimeAgo(featuredCategoryArticle.createdAt)}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ) : (
            <Card className="col-span-2 overflow-hidden">
              <Skeleton className="h-[180px] sm:h-[400px] w-full" />
            </Card>
          )}

          {/* Related Articles */}
          <div className="flex flex-col gap-1 sm:gap-2 sm:space-y-2 h-full">
            {relatedArticles.length > 0 ? (
              relatedArticles.map(article => (
                <Card key={article._id} className="overflow-hidden flex-1">
                  <div className="flex flex-row items-center h-full">
                    <div className="w-1/3 h-full">
                      <img
                        src={optimizeImageUrl(getImageUrl(article.image), 300)}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        width={300}
                        height={80}
                        className="h-full min-h-[44px] sm:h-20 sm:min-h-0 w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-1.5 sm:p-2.5 w-2/3">
                      <h4 className="font-medium text-[10px] sm:text-[13px] leading-snug mb-0.5 sm:mb-1 line-clamp-2">
                        <Link to={`/article/${article.slug}`} className="hover:text-primary transition-colors">
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-gray-500 text-[9px] sm:text-xs">{formatTimeAgo(article.createdAt)}</p>
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
            {/* Ad fills the leftover space under the related articles,
                full-width at its own aspect ratio (never cropped). */}
            {squareAdSlot !== null && (
              <Suspense fallback={null}>
                <AdvertisementDisplay
                  position="category-square"
                  slotIndex={squareAdSlot}
                  variant={squareAdSlot % 2 === 0 ? 'auto' : 'strip'}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Generate SEO keywords based on categories and article titles
  const generateKeywords = () => {
    const baseKeywords = ['news', 'latest news', 'breaking news', 'india news'];

    // Add category names (guard: a nameless category must not crash the page)
    const categoryKeywords = categories.map(cat => (typeof cat?.name === 'string' ? cat.name : '').toLowerCase());

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
    <div className="space-y-2">

      {/* SEO Optimization */}

      <SEO
        title="Breaking News, Latest News, Trending Stories | Mibnews"
        description={generateDescription()}
        keywords={generateKeywords()}
        type="website"
        image={articles.length > 0 && articles[0].image ? getImageUrl(articles[0].image) : "/mibnews-logo.png"}
        breadcrumbs={[]}
      />

      {/* Top hero layout: LEFT header-ad + banner | RIGHT slider + hero-ad + related */}
      <section className="-mt-1">
        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3 sm:items-stretch sm:gap-6">
          {/* LEFT column: top header ad, then banner article below */}
          <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:h-full sm:gap-3">
            <div className="leading-none">
              <Suspense fallback={null}>
                <AdvertisementDisplay position="header" onlyShowOne={true} />
              </Suspense>
            </div>
          {/* Featured Banner Article (height reduced 20%: 400px -> 320px) */}
          {loading ? (
            <Card className="overflow-hidden">
              <Skeleton className="h-[145px] w-full sm:h-[320px]" />
            </Card>
          ) : featuredArticle ? (
            <Card className="overflow-hidden flex flex-col sm:flex-1">
              <Link to={`/article/${featuredArticle.slug}`} className="flex flex-1 flex-col">
                <div className="relative flex-1 min-h-[112px] sm:min-h-[320px] sm:h-full">
                  <img
                    src={optimizeImageUrl(getImageUrl(featuredArticle.image), 800)}
                    alt={featuredArticle.title}
                    width={800}
                    height={400}
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 sm:p-6">
                    <Badge variant="outline" className="bg-primary text-white mb-1 sm:mb-2 text-[10px] sm:text-sm">
                      {getCategoryName(featuredArticle.category)}
                    </Badge>
                    <h2 className="text-xs sm:text-xl md:text-3xl font-bold text-white mb-1 sm:mb-2 line-clamp-3">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-gray-200 text-[10px] sm:text-sm">{formatTimeAgo(featuredArticle.createdAt)}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ) : (
            <Card className="overflow-hidden p-2 sm:p-6">
              <p className="text-xs sm:text-base">No articles found. Please check back later.</p>
            </Card>
          )}
          </div>

          {/* RIGHT column: 3 items sized to EQUAL left column (header-ad ~110 + gap 12 + banner 320 = ~442px) */}
          <div className="flex min-w-0 flex-col gap-1 sm:h-full sm:gap-0 sm:space-y-0">
            <div className="sm:h-[150px] sm:shrink-0">
              <Suspense fallback={<div className="h-[140px] w-full animate-pulse rounded-md bg-gray-100 sm:h-[150px]" />}>
                <TopInfoSlider />
              </Suspense>
            </div>

            {loading ? (
              [...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[180px] w-full" />
                </Card>
              ))
            ) :
              secondaryArticles.length > 0 ? (
                <>
                  {/* Hero ad — natural size, small gap from slider */}
                  <div className="mt-1 sm:mt-[12px] sm:shrink-0">
                    <Suspense fallback={null}>
                      <AdvertisementDisplay position="home-hero-side" onlyShowOne={true} />
                    </Suspense>
                  </div>

                  {secondaryArticles.slice(0, 1).map((article) => (
                    <Card key={article._id} className="overflow-hidden sm:mt-[12px] sm:min-h-0 sm:flex-1">
                      <Link to={`/article/${article.slug}`} className="block h-full">
                        <div className="relative h-full min-h-[90px] sm:h-full sm:min-h-[128px]">
                          <img
                            src={optimizeImageUrl(getImageUrl(article.image), 400)}
                            alt={article.title}
                            loading="lazy"
                            decoding="async"
                            width={400}
                            height={180}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1.5 sm:p-4">
                            <Badge variant="outline" className="bg-primary text-white mb-0.5 sm:mb-2 text-[9px] sm:text-sm">
                              {getCategoryName(article.category)}
                            </Badge>
                            <h3 className="text-[10px] sm:text-sm md:text-base font-bold text-white mb-0.5 sm:mb-1 line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-gray-200 text-[9px] sm:text-xs">{formatTimeAgo(article.createdAt)}</p>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}

                </>
              ) : (
                <Card className="overflow-hidden p-4">
                  <p>No articles found.</p>
                </Card>
              )}
          </div>

        </div>


        <div className="mt-1 space-y-1.5">
          <div className="w-full">
            {/* Featured Reels Section with Carousel */}
            <div className="bg-white px-4 py-2 rounded-[2px] shadow-sm min-h-[120px]">
              <Suspense fallback={null}>
                <ReelsCarousel featured={true} limit={6} />
              </Suspense>
            </div>

            {/* Short Posts Section with Carousel */}
            <div className="bg-white px-4 py-2 rounded-[2px] shadow-sm min-h-[120px]">
              <Suspense fallback={null}>
                <ShortPostsCarousel limit={6} />
              </Suspense>
            </div>

            {/* Instagram Reels Section */}
            <div className="bg-white px-4 py-2 rounded-[2px] shadow-sm min-h-[120px]">
              <Suspense fallback={null}>
                <InstagramReels limit={6} />
              </Suspense>
            </div>

          </div>
        </div>

        {/* Category Header Advertisement */}
        <div className="my-1">
          <Suspense fallback={null}>
            <AdvertisementDisplay position="category-header" onlyShowOne={true} />
          </Suspense>
        </div>

        {/* News Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="w-full justify-start border-b rounded-none px-0 mb-1">
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
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-20 sm:h-[200px] w-full" />
                    <CardContent className="p-1.5 sm:p-4">
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
                      <div className="relative h-20 sm:h-[200px]">
                        <img
                          src={optimizeImageUrl(getImageUrl(article.image), 400)}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-1.5 sm:p-4">
                        <Badge variant="outline" className="bg-primary text-white mb-1 sm:mb-2 text-[9px] sm:text-xs">
                          {getCategoryName(article.category)}
                        </Badge>
                        <h3 className="font-semibold mb-1 sm:mb-2 text-[10px] sm:text-base leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-[9px] sm:text-sm">{formatTimeAgo(article.createdAt)}</p>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-2">
                  <p className="text-xs sm:text-base">No articles found. Please check back later.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-20 sm:h-[200px] w-full" />
                    <CardContent className="p-1.5 sm:p-4">
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
                      <div className="relative h-20 sm:h-[200px]">
                        <img
                          src={optimizeImageUrl(getImageUrl(article.image), 400)}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-1.5 sm:p-4">
                        <Badge variant="outline" className="bg-primary text-white mb-1 sm:mb-2 text-[9px] sm:text-xs">
                          {getCategoryName(article.category)}
                        </Badge>
                        <h3 className="font-semibold mb-1 sm:mb-2 text-[10px] sm:text-base leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-[9px] sm:text-sm">{formatTimeAgo(article.createdAt)}</p>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-2">
                  <p className="text-xs sm:text-base">No trending articles found. Please check back later.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-20 sm:h-[200px] w-full" />
                    <CardContent className="p-1.5 sm:p-4">
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
                      <div className="relative h-20 sm:h-[200px]">
                        <img
                          src={optimizeImageUrl(getImageUrl(article.image), 400)}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-1.5 sm:p-4">
                        <Badge variant="outline" className="bg-primary text-white mb-1 sm:mb-2 text-[9px] sm:text-xs">
                          {getCategoryName(article.category)}
                        </Badge>
                        <h3 className="font-semibold mb-1 sm:mb-2 text-[10px] sm:text-base leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-[9px] sm:text-sm">{formatTimeAgo(article.createdAt)}</p>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-2">
                  <p className="text-xs sm:text-base">No popular articles found. Please check back later.</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </section>

      {/* Category Articles Sections */}
      <div className="mt-1.5">
        <h2 className="text-base sm:text-2xl font-bold mb-1">Categories</h2>
        {categoriesLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-1">
                <Skeleton className="h-8 w-48 mb-1" />
                <div className="grid grid-cols-3 gap-2 sm:gap-6">
                  <Skeleton className="h-[180px] sm:h-[400px] col-span-2" />
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
          <div className="space-y-1.5">
            {categories.map((category, index) => {
              // Ad categories (every 2nd): square-ad slots show 2 related
              // articles, banner-strip slots show 3, others show 4.
              const squareSlot = index % 2 === 1 ? Math.floor(index / 2) : null;
              const relatedLimit = squareSlot === null ? 4 : (squareSlot % 2 === 1 ? 3 : 2);
              return (
                <div key={category._id} className="category-section">
                  {renderCategorySection(
                    category._id,
                    category.name,
                    category.slug,
                    relatedLimit,
                    squareSlot,
                  )}
                  {/* Insert advertisement after every category section */}
                  {index % 2 === 1 && (
                    <div className="my-1">
                      <Suspense fallback={null}>
                        <AdvertisementDisplay
                          position="in-article"
                          onlyShowOne={true}
                          slotIndex={Math.floor(index / 2)}
                        />
                      </Suspense>
                    </div>
                  )}
                  <Separator className="my-1" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-2">
            <p>No categories found.</p>
          </div>
        )}
      </div>

      {/* Footer Advertisement */}
      <div className="mt-1.5 mb-1">
        <Suspense fallback={null}>
          <AdvertisementDisplay position="footer" onlyShowOne={true} />
        </Suspense>
      </div>

    </div>
  );
};

export default HomePage;
