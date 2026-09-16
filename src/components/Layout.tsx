
import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavbarTop from './NavbarTop';
import BreakingNews from './BreakingNews';
import CookieConsent from './CookieConsent';
import { useLanguage } from './LanguageSwitcher';
import { getCategories, CategoryType } from '@/services/categoryService';
import { siteSettingApi, newsletterApi } from '@/lib/api-client';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Send,
  ChevronRight,
  ArrowUp,
  Loader2,
} from 'lucide-react';
import logo from "@/assets/mibnews-logo.png"

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Latest News', to: '/latest' },
  { label: 'Breaking News', to: '/breaking' },
  { label: 'National', to: '/national' },
  { label: 'World', to: '/world' },
  { label: 'Entertainment', to: '/entertainment' },
  { label: 'Sports', to: '/sports' },
];

const COMPANY_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Careers', to: '/career' },
  { label: 'Short Posts', to: '/short-posts' },
  { label: 'Reels', to: '/reels' },
  { label: 'Videos', to: '/videos' },
  { label: 'Live TV', to: '/live-tv' },
];

const SOCIAL_LINKS = [
  { label: 'Twitter / X', href: 'https://x.com', Icon: Twitter },
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'YouTube', href: 'https://youtube.com', Icon: Youtube },
];

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold uppercase tracking-widest text-white">
    {children}
    <span className="mt-2 block h-0.5 w-10 rounded bg-red-600" />
  </h3>
);

const Layout = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [siteTitle, setSiteTitle] = useState('Mibnews');
  const [siteTagline, setSiteTagline] = useState(
    'Delivering the latest breaking news and top stories across politics, entertainment, sports, business from India and around the world.'
  );

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [nlState, setNlState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nlMessage, setNlMessage] = useState('');

  // Dynamic site identity (title + tagline) from backend public settings
  useEffect(() => {
    let mounted = true;
    siteSettingApi
      .getPublicSettings()
      .then((res) => {
        if (!mounted || !res?.success || !res?.data) return;
        if (res.data.siteTitle) setSiteTitle(String(res.data.siteTitle));
        if (res.data.siteTagline) setSiteTagline(String(res.data.siteTagline));
      })
      .catch(() => {
        /* keep defaults when backend is unreachable */
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Dynamic categories for the footer
  useEffect(() => {
    let mounted = true;
    getCategories({ active: true, language })
      .then((cats) => {
        if (mounted) setCategories((cats || []).slice(0, 7));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, [language]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      setNlState('error');
      setNlMessage('Please enter your email address.');
      return;
    }
    setNlState('loading');
    setNlMessage('');
    try {
      const res = await newsletterApi.subscribe(email);
      setNlState('success');
      setNlMessage(res?.message || 'Subscribed successfully. Welcome aboard!');
      setNewsletterEmail('');
    } catch (err) {
      setNlState('error');
      setNlMessage(err instanceof Error ? err.message : 'Subscription failed. Please try again.');
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <NavbarTop />
      </header>

      <BreakingNews />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-950 text-gray-300">
        {/* Brand accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-blue-900" />

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Brand + contact */}
            <div>
              <Link to="/" className="inline-block rounded-xl bg-white px-4 py-2 shadow-lg">
                <img src={logo} alt={`${siteTitle} logo`} className="h-12 w-auto" />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">{siteTagline}</p>

              <p className="mt-5 text-sm font-semibold text-white">Subscribe to newsletter</p>
              <form onSubmit={handleSubscribe} className="mt-3">
                <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5 focus-within:border-red-600">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    aria-label="Email address"
                    className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={nlState === 'loading'}
                    aria-label="Subscribe"
                    className="flex shrink-0 items-center gap-1.5 bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {nlState === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {nlMessage && (
                  <p
                    className={`mt-2 text-xs ${
                      nlState === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {nlMessage}
                  </p>
                )}
              </form>
            </div>

            {/* Quick links */}
            <nav aria-label="Quick links">
              <SectionHeading>Quick Links</SectionHeading>
              <ul className="mt-5 space-y-2.5 text-sm">
                {QUICK_LINKS.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-gray-400 transition hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-red-600 transition-transform group-hover:translate-x-0.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Dynamic categories */}
            <nav aria-label="News categories">
              <SectionHeading>Categories</SectionHeading>
              <ul className="mt-5 space-y-2.5 text-sm">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <li key={cat._id || cat.slug || cat.name}>
                      <Link
                        to={`/category/${cat.slug || cat._id}`}
                        className="group inline-flex items-center gap-1.5 text-gray-400 transition hover:text-white"
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-red-600 transition-transform group-hover:translate-x-0.5" />
                        {cat.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="text-gray-500">Politics</li>
                    <li className="text-gray-500">Business</li>
                    <li className="text-gray-500">Technology</li>
                    <li className="text-gray-500">Health</li>
                  </>
                )}
              </ul>
            </nav>

            {/* Company */}
            <div>
              <SectionHeading>Company</SectionHeading>
              <ul className="mt-5 space-y-2.5 text-sm">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-gray-400 transition hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-red-600 transition-transform group-hover:translate-x-0.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect + contact (last column) */}
            <div>
              <SectionHeading>Connect With Us</SectionHeading>
              <p className="mt-5 text-sm font-semibold text-white">Follow Us</p>
              <div className="mt-3 flex items-center gap-3">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-red-600 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>

              <p className="mt-6 text-sm font-semibold text-white">Contact Us</p>
              <div className="mt-3 space-y-2.5 text-sm text-gray-400">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>
                    O-794, 7th Floor, Gaur City Center,
                    <br />
                    Greater Noida West, UP 201318
                  </span>
                </p>
                <a
                  href="mailto:info@mibnews.in"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-red-500" />
                  info@mibnews.in
                </a>
                <a
                  href="tel:+919999292210"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0 text-red-500" />
                  +91 99992 92210
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-5 text-xs text-gray-500 md:flex-row">
            <p>
              &copy; {new Date().getFullYear()} {siteTitle}. All Rights Reserved.
            </p>
            <div className="flex items-center gap-5">
              <Link to="/privacy-policy" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/contact" className="transition hover:text-white">
                Contact
              </Link>
              <Link to="/career" className="transition hover:text-white">
                Careers
              </Link>
            </div>
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-red-600 hover:text-white"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
};

export default Layout;
