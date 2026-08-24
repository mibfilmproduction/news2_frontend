/**
 * Sitemap Generator for mibDaily News
 * 
 * This utility generates a sitemap.xml file to improve search engine indexing
 * and discoverability of the news website content.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Base URL of the site
const SITE_URL = process.env.SITE_URL || 'https://mibitnews.com';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Generate the XML sitemap
 */
async function generateSitemap() {
  try {
    console.log('Starting sitemap generation...');
    const sitemapPath = path.join(__dirname, '../../public/sitemap.xml');
    
    // Start XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    const staticPages = [
      {url: '/', priority: '1.0', changefreq: 'daily'},
      {url: '/about', priority: '0.7', changefreq: 'monthly'},
      {url: '/contact', priority: '0.7', changefreq: 'monthly'},
      {url: '/categories', priority: '0.8', changefreq: 'weekly'},
      {url: '/short-posts', priority: '0.8', changefreq: 'daily'},
      {url: '/reels', priority: '0.8', changefreq: 'daily'},
      {url: '/careers', priority: '0.7', changefreq: 'weekly'},
      {url: '/advertise', priority: '0.7', changefreq: 'monthly'}
    ];

    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    }

    // Add categories
    try {
      const categoriesResponse = await axios.get(`${API_URL}/categories`);
      
      if (categoriesResponse.data && categoriesResponse.data.success && categoriesResponse.data.data) {
        const categories = categoriesResponse.data.data;
        
        for (const category of categories) {
          sitemap += `  <url>
    <loc>${SITE_URL}/category/${category.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }

    // Add articles (news content)
    try {
      const articlesResponse = await axios.get(`${API_URL}/news`);
      
      if (articlesResponse.data && articlesResponse.data.success && articlesResponse.data.data) {
        const articles = articlesResponse.data.data;
        
        for (const article of articles) {
          const pubDate = new Date(article.createdAt).toISOString();
          let categoryName = '';
          
          if (typeof article.category === 'object' && article.category) {
            categoryName = article.category.name;
          } else if (typeof article.category === 'string') {
            // If we only have category ID, we could fetch the category name here
            categoryName = 'News'; // Default fallback
          }
          
          sitemap += `  <url>
    <loc>${SITE_URL}/article/${article.slug}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <news:news>
      <news:publication>
        <news:name>mibDaily News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${categoryName.toLowerCase()}, news</news:keywords>
    </news:news>
    <image:image>
      <image:loc>${article.image.startsWith('http') ? article.image : SITE_URL + article.image}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>
  </url>\n`;
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error.message);
    }

    // Close XML
    sitemap += '</urlset>';

    // Write the file
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Sitemap generated successfully at ${sitemapPath}`);
    
    return {
      success: true,
      path: sitemapPath
    };
  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// If this script is run directly
if (require.main === module) {
  generateSitemap()
    .then(result => {
      if (result.success) {
        console.log('Sitemap generation completed successfully!');
      } else {
        console.error('Sitemap generation failed:', result.error);
      }
    })
    .catch(err => {
      console.error('Unexpected error during sitemap generation:', err);
    });
}

module.exports = {
  generateSitemap
};
