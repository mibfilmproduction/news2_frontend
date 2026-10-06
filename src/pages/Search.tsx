import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Search as SearchIcon, Calendar, Tag, Filter } from 'lucide-react';
import { api } from '@/lib/api-client';
import SEO from '@/components/SEO';
import { ALL_CITIES, ALL_CITIES_LABEL, ALL_STATES, ALL_STATES_LABEL, STATES, citiesForState, cityLabel, isAllCities, isAllStates, stateLabel } from '@/lib/cities';

interface Article {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  city?: string;
  tags: string[];
  author: {
    _id: string;
    name: string;
  };
  viewCount: number;
  isBreaking: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || '';
  const initialTag = queryParams.get('tag') || '';
  const initialCity = queryParams.get('city') || ALL_CITIES;
  const initialState = queryParams.get('state') || ALL_STATES;
  const initialPage = parseInt(queryParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedState, setSelectedState] = useState(initialState);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [noResults, setNoResults] = useState(false);
  const articlesPerPage = 10;

  useEffect(() => {
    // Fetch categories once
    fetchCategories();
    // Fetch popular tags once
    fetchPopularTags();
  }, []);

  useEffect(() => {
    // Search articles based on URL parameters
    if (initialQuery || initialCategory || initialTag || (initialCity && !isAllCities(initialCity)) || (initialState && !isAllStates(initialState))) {
      searchArticles();
    }
  }, [location.search]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      // This endpoint should return popular tags based on usage
      const response = await api.get('/news/tags/popular');
      if (response.success && response.data) {
        setPopularTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      // Fallback to some default tags if API doesn't exist
      setPopularTags(['Politics', 'Sports', 'Technology', 'Health', 'Entertainment']);
    }
  };

  const searchArticles = async (pageOverride?: number, overrides?: { city?: string; state?: string }) => {
    try {
      setLoading(true);
      setNoResults(false);

      // Use the explicit page when provided (fixes stale-state pagination bug)
      const page = pageOverride ?? currentPage;
      const city = overrides?.city ?? selectedCity;
      const state = overrides?.state ?? selectedState;

      const params: Record<string, string> = {
        page: page.toString(),
        limit: articlesPerPage.toString(),
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (selectedTag) {
        params.tag = selectedTag;
      }

      if (city && !isAllCities(city)) {
        params.city = city;
      }
      if (state && !isAllStates(state)) {
        params.state = state;
      }

      const response = await api.get('/news/search', params);

      if (response.success && response.data) {
        setArticles(response.data);
        
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
        }
        
        if (response.data.length === 0) {
          setNoResults(true);
        }
      } else {
        setNoResults(true);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, selectedCity, selectedState, 1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateUrlAndSearch(searchQuery, selectedTag, value, selectedCity, selectedState, 1);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setCurrentPage(1);
    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, value, selectedState, 1);
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity(ALL_CITIES);
    setCurrentPage(1);
    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, ALL_CITIES, value, 1);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1);
    updateUrlAndSearch(searchQuery, tag, selectedCategory, selectedCity, selectedState, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, selectedCity, selectedState, page);
  };

  const updateUrlAndSearch = (
    query = searchQuery,
    tag = selectedTag,
    category = selectedCategory,
    city = selectedCity,
    state = selectedState,
    page = 1
  ) => {
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (city && !isAllCities(city)) params.set('city', city);
    if (state && !isAllStates(state)) params.set('state', state);
    if (page > 1) params.set('page', page.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);

    // Pass city explicitly (state may still hold the previous value)
    searchArticles(page, { city, state });
  };

  // Keep URL in sync with browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      const cat = params.get('category') || '';
      const tag = params.get('tag') || '';
      const city = params.get('city') || ALL_CITIES;
      const state = params.get('state') || ALL_STATES;
      const page = parseInt(params.get('page') || '1', 10);

      setSearchQuery(q);
      setSelectedCategory(cat);
      setSelectedTag(tag);
      setSelectedCity(city);
      setSelectedState(state);
      setCurrentPage(page);
      searchArticles(page, { city, state });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    const base = (import.meta.env.VITE_MEDIA_URL as string) || ((import.meta.env.VITE_API_URL as string || '').replace(/\/api\/?$/, '') + '/uploads');
    const clean = String(imagePath).replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) return `${base.replace(/\/uploads\/?$/, '')}/${clean}`;
    return `${base.replace(/\/$/, '')}/${clean}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="mb-6 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4">
            <Skeleton className="h-48 w-full md:h-full" />
          </div>
          <div className="p-4 md:w-3/4">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Search Articles"
        description="Search news articles on Mibnews. Find the latest news, top stories and articles by keyword, category or date."
        url="/search"
        keywords={['search news', 'find articles', 'news search', 'mibnews']}
      />
      <h1 className="text-3xl font-bold mb-8">Search Articles</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 mb-6">
            <h2 className="font-bold mb-4 flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  <Tag className="inline mr-2 h-4 w-4" />
                  Category
                </label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('');
                    updateUrlAndSearch(searchQuery, selectedTag, '', selectedCity, selectedState);
                  }}
                >
                  Clear Category
                </Button>
              )}

              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1">
                  State
                </label>
                <Select
                  value={selectedState}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ALL_STATES_LABEL} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATES}>{ALL_STATES_LABEL}</SelectItem>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isAllStates(selectedState) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedState(ALL_STATES);
                    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, ALL_CITIES, ALL_STATES);
                  }}
                >
                  Clear State
                </Button>
              )}

              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <Select
                  value={selectedCity}
                  onValueChange={handleCityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ALL_CITIES_LABEL} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CITIES}>{ALL_CITIES_LABEL}</SelectItem>
                    {citiesForState(selectedState).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isAllCities(selectedCity) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCity(ALL_CITIES);
                    updateUrlAndSearch(searchQuery, selectedTag, selectedCategory, ALL_CITIES, selectedState);
                  }}
                >
                  Clear City
                </Button>
              )}
            </div>
          </Card>
          
          <Card className="p-4">
            <h2 className="font-bold mb-4">Popular Tags</h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedTag('');
                  updateUrlAndSearch(searchQuery, '', selectedCategory, selectedCity);
                }}
              >
                Clear Tag
              </Button>
            )}
          </Card>
        </div>
        
        {/* Search results */}
        <div className="lg:col-span-3">
          <Card className="p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder="Search for articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </Card>
          
          {loading ? (
            renderSkeletons()
          ) : noResults ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold mb-2">No articles found</h2>
              <p className="text-gray-500">
                Try adjusting your search criteria or browse all articles.
              </p>
            </div>
          ) : (
            <>
              {articles.map(article => (
                <Card key={article._id} className="mb-6 overflow-hidden">
                  <Link to={`/article/${article.slug}`} className="flex flex-col md:flex-row h-full">
                    <div className="md:w-1/3 h-48 md:h-auto">
                      <img 
                        src={getImageUrl(article.image)} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 md:w-2/3 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {getCategoryName(article.category)}
                        </Badge>
                        {!isAllCities(article.city) && (
                          <Badge variant="secondary">{cityLabel(article.city)}</Badge>
                        )}
                        {article.isBreaking && (
                          <Badge variant="destructive">Breaking</Badge>
                        )}
                      </div>
                      
                      <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                      
                      <p className="text-gray-600 mb-4 flex-grow">
                        {article.summary || article.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(article.createdAt)}
                        
                        {article.tags && article.tags.length > 0 && (
                          <div className="ml-4 flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {article.tags.slice(0, 3).join(', ')}
                            {article.tags.length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
              
              {totalPages > 1 && (
                <Pagination className="my-6">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ))
                      .map((page, i, array) => (
                        <React.Fragment key={page}>
                          {i > 0 && array[i - 1] !== page - 1 && (
                            <PaginationItem>
                              <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))
                    }
                    
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
