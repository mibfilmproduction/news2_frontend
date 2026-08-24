import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from './LanguageSwitcher';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video' | 'profile';
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  category?: string;
  readingTime?: string;
  isAmp?: boolean;
  noIndex?: boolean;
  noFollow?: boolean;
  alternateUrls?: { [lang: string]: string };
  video?: {
    url: string;
    duration?: string;
    uploadDate?: string;
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const siteName = 'Mibnews';
const siteDescription = 'Delivering the latest breaking news and top stories across politics, entertainment, sports, business from India and around the world.';
const defaultDescription = 'The latest news and updates from Mibnews - Your trusted source for breaking news in Hindi and English';
const defaultImage = '/logo.png';
const twitterHandle = '@mibnews';
const facebookPage = 'mibnews';

const SEO: React.FC<SEOProps> = ({
  title,
  description = defaultDescription,
  keywords = [],
  image = defaultImage,
  url,
  type = 'website',
  publishedAt,
  updatedAt,
  author,
  category,
  readingTime,
  isAmp = false,
  noIndex = false,
  noFollow = false,
  alternateUrls = {},
  video,
  breadcrumbs = []
}) => {
  const { language } = useLanguage();
  
  // Construct full title with site name
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  
  // Make sure image URL is absolute
  const imageUrl = image.startsWith('http') 
    ? image 
    : `${import.meta.env.VITE_SITE_URL || window.location.origin}${image}`;
    
  // Current page URL
  const pageUrl = url || window.location.href;
  
  // Add language-specific suffix to title for SEO
  const languageSuffix = language === 'hindi' ? ' - हिंदी में समाचार' : ' - News in English';
  const seoTitle = title ? `${fullTitle}${languageSuffix}` : fullTitle;
  
  // Meta robots content
  const robotsContent = `${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'}`;
  
  // Construct breadcrumbs schema
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${import.meta.env.VITE_SITE_URL || window.location.origin}`
    },
    ...breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${import.meta.env.VITE_SITE_URL || window.location.origin}${crumb.url}`
    }))
  ];
  
  // Ensure all values are stringifiable to prevent Symbol conversion errors
  const safeStringify = (obj: any) => {
    if (obj === null || obj === undefined) return null;
    // Clone the object to avoid modifying the original
    const safeObj = JSON.parse(JSON.stringify(obj, (key, value) => {
      // Handle Symbol values or other non-serializable types
      if (typeof value === 'symbol' || (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
        return String(value);
      }
      return value;
    }));
    return safeObj;
  };
  
  // Construct article schema for news articles with safe values
  const articleSchema = type === 'article' ? {
    '@type': 'NewsArticle',
    headline: String(title || ''),
    description: String(description || ''),
    image: imageUrl,
    url: pageUrl,
    datePublished: String(publishedAt || ''),
    dateModified: String(updatedAt || publishedAt || ''),
    author: {
      '@type': 'Person',
      name: String(author || 'Mibnews')
    },
    publisher: {
      '@type': 'Organization',
      name: String(siteName),
      logo: {
        '@type': 'ImageObject',
        url: `${import.meta.env.VITE_SITE_URL || window.location.origin}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    },
    ...(category ? {
      articleSection: typeof category === 'symbol' ? String(category) : category
    } : {}),
    ...(readingTime ? {
      timeRequired: typeof readingTime === 'symbol' ? String(readingTime) : readingTime
    } : {})
  } : null;
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{seoTitle}</title>
      <meta name="description" content={description} />
      <meta name="image" content={imageUrl} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Search engines directives */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      
      {/* Language */}
      <html lang={language === 'hindi' ? 'hi' : 'en'} />
      
      {/* Device specific */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#1e40af" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      
      {/* Schema.org structured data */}
      {/* Main WebSite schema */}
      <script type="application/ld+json">
        {JSON.stringify(safeStringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: String(siteName),
          url: String(import.meta.env.VITE_SITE_URL || window.location.origin),
          description: String(siteDescription),
          potentialAction: {
            '@type': 'SearchAction',
            target: `${import.meta.env.VITE_SITE_URL || window.location.origin}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }))}
      </script>
      
      {/* Organization schema */}
      <script type="application/ld+json">
        {JSON.stringify(safeStringify({
          '@context': 'https://schema.org',
          '@type': 'NewsMediaOrganization',
          name: String(siteName),
          url: String(import.meta.env.VITE_SITE_URL || window.location.origin),
          logo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/logo.png`,
          sameAs: [
            `https://www.facebook.com/${facebookPage}`,
            `https://twitter.com/${twitterHandle.replace('@', '')}`,
            'https://www.instagram.com/mibnews/',
            'https://www.youtube.com/@mibnews'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-1234567890',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: ['English', 'Hindi']
          }
        }))}
      </script>
      
      {/* Page-specific schema (Article, Video, etc.) */}
      {type === 'article' && articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(safeStringify(articleSchema))}
        </script>
      )}
      
      {/* Video structured data if video exists */}
      {video && (
        <script type="application/ld+json">
          {JSON.stringify(safeStringify({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: String(title || ''),
            description: String(description || ''),
            thumbnailUrl: imageUrl,
            uploadDate: String(video.uploadDate || publishedAt || new Date().toISOString()),
            duration: String(video.duration || 'PT0M0S'),
            contentUrl: String(video.url || ''),
            embedUrl: String(video.url || ''),
            publisher: {
              '@type': 'Organization',
              name: String(siteName),
              logo: {
                '@type': 'ImageObject',
                url: `${import.meta.env.VITE_SITE_URL || window.location.origin}/logo.png`
              }
            }
          }))}
        </script>
      )}
      
      {/* BreadcrumbList schema */}
      {breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(safeStringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems
          }))}
        </script>
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:title" content={String(fullTitle)} />
      <meta property="og:description" content={String(description)} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={language === 'hindi' ? 'hi_IN' : 'en_US'} />
      {type === 'article' && (
        <>
          <meta property="article:author" content={`https://www.facebook.com/${facebookPage}`} />
          <meta property="article:publisher" content={`https://www.facebook.com/${facebookPage}`} />
        </>
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      
      {/* Additional article metadata */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && updatedAt && (
        <meta property="article:modified_time" content={updatedAt} />
      )}
      {type === 'article' && category && (
        <meta property="article:section" content={category} />
      )}
      {readingTime && (
        <meta property="reading_time" content={readingTime} />
      )}
      
      {/* Alternate language links */}
      {Object.entries(alternateUrls).map(([lang, langUrl]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={langUrl} />
      ))}
      
      {/* AMP link for articles if available */}
      {isAmp && (
        <link rel="amphtml" href={`${pageUrl}?amp=1`} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
  );
};

export default SEO;
