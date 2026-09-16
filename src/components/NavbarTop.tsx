import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, Bell, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LanguageSwitcher, { useLanguage } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import UserMenu from "./UserMenu";
import logo from "@/assets/mibnews-logo.png";
import { getCategories, CategoryType } from "@/services/categoryService";
import { cn } from "@/lib/utils";

const STATIC_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Latest', to: '/latest' },
  { label: 'Breaking', to: '/breaking' },
  { label: 'Videos', to: '/videos' },
  { label: 'Live TV', to: '/live-tv', live: true },
  { label: 'Sports', to: '/sports' },
  { label: 'Short Posts', to: '/short-posts' },
  { label: 'Reels', to: '/reels' },
];

const NavbarTop = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const categories = await getCategories({ active: true, language });
        setCategories(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [language]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  // ---- Desktop nav: fit links in 85% width, rest goes to "More" (no scroll) ----
  const allNavLinks = [
    ...STATIC_LINKS.map((l) => ({
      key: `static-${l.to}`,
      label: l.label,
      to: l.to,
      live: (l as { live?: boolean }).live,
    })),
    ...categories.map((c) => ({
      key: `cat-${c._id}`,
      label: c.name,
      to: `/category/${c.slug}`,
      live: false as boolean | undefined,
    })),
  ];
  const [visibleCount, setVisibleCount] = useState(10);
  const navRowRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const row = navRowRef.current;
      const measure = measureRef.current;
      if (!row || !measure) return;
      // 85% of the row for links, rest reserved for the "More" button sitting just after them
      const available = Math.floor(row.clientWidth * 0.85);
      const kids = Array.from(measure.children) as HTMLElement[];
      const GAP = 20; // gap-5
      let used = 0;
      let count = 0;
      for (const kid of kids) {
        const w = kid.offsetWidth;
        if (used + w <= available) {
          used += w + GAP;
          count += 1;
        } else {
          break;
        }
      }
      setVisibleCount(Math.max(3, Math.min(count, kids.length)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [categories, language, isCategoriesLoading]);

  const visibleLinks = allNavLinks.slice(0, visibleCount);
  const overflowLinks = allNavLinks.slice(visibleCount);

  return (
    <div className="w-full overflow-hidden bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-18 items-center justify-between overflow-hidden py-0">
          {/* Logo */}
          <Link to="/" className="flex h-full w-[120px]   shrink-0 items-center overflow-hidden py-2 my-0 leading-none">
            <img 
              src={logo} 
              alt="Logo" 
              className="block h-full w-full object-contain object-center p-0 m-0" 
            />
          </Link>

          {/* Search Box - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <Button type="submit" variant="ghost" className="absolute right-0 top-0 h-full px-3" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-1 md:space-x-4">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">3</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" sideOffset={5}>
                <div className="px-4 py-3 font-medium border-b">Notifications</div>
                <DropdownMenuItem className="flex flex-col items-start cursor-default p-3">
                  <p className="font-medium">Breaking News Alert</p>
                  <p className="text-xs text-gray-500 mt-1">PM announces new economic reforms package</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start cursor-default p-3">
                  <p className="font-medium">Live Match Update</p>
                  <p className="text-xs text-gray-500 mt-1">India vs Australia: India wins by 5 wickets</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start cursor-default p-3">
                  <p className="font-medium">Weather Alert</p>
                  <p className="text-xs text-gray-500 mt-1">Heavy rainfall expected in coastal areas</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-primary p-2">
                  <Link to="/notifications">View all notifications</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" className="mr-2 hidden sm:block" />

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search - Expandable */}
        {isSearchOpen && (
          <div className="py-3 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <Button type="submit" variant="ghost" className="absolute right-0 top-0 h-full px-3" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Category Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container relative mx-auto px-4">
          {/* Desktop Categories Menu - max 85% width, overflow goes to "More", no scrollbar */}
          <div ref={navRowRef} className="hidden md:flex items-center justify-start gap-4 py-3 text-sm font-medium">
            <div className="flex min-w-0 max-w-[85%] items-center gap-5 overflow-hidden">
              {visibleLinks.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  className={cn(
                    "whitespace-nowrap hover:text-primary flex shrink-0 items-center",
                    isActive(link.to) ? "text-primary font-semibold" : "text-gray-800"
                  )}
                >
                  {link.live && (
                    <span className="inline-flex h-2 w-2 bg-red-600 rounded-full mr-1.5 animate-pulse" />
                  )}
                  {link.label}
                </Link>
              ))}
            </div>

            {overflowLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0 text-gray-800 flex items-center p-0 h-auto font-medium">
                    More <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowLinks.map((link) => (
                    <DropdownMenuItem key={link.key} asChild>
                      <Link to={link.to} className="w-full flex items-center">
                        {link.live && (
                          <span className="inline-flex h-2 w-2 bg-red-600 rounded-full mr-1.5 animate-pulse" />
                        )}
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Hidden measurer (same font/whitespace) to compute how many links fit in 85% */}
          <div
            ref={measureRef}
            aria-hidden="true"
            className="invisible absolute left-0 top-0 flex items-center gap-5 whitespace-nowrap text-sm font-medium"
          >
            {allNavLinks.map((link) => (
              <span key={link.key} className="flex items-center">
                {link.live && (
                  <span className="inline-flex h-2 w-2 rounded-full mr-1.5" />
                )}
                {link.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-3">
            {STATIC_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "hover:text-primary font-medium py-2 flex items-center",
                  isActive(link.to) ? "text-primary" : "text-gray-800"
                )}
              >
                {link.live && (
                  <span className="inline-flex h-2 w-2 bg-red-600 rounded-full mr-1.5 animate-pulse" />
                )}
                {link.label}
              </Link>
            ))}

            {!isCategoriesLoading && categories.map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                className="text-gray-800 hover:text-primary font-medium py-2"
              >
                {category.name}
              </Link>
            ))}

            <Link to="/contact" className="text-gray-800 hover:text-primary font-medium py-2">
              Contact
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarTop;
