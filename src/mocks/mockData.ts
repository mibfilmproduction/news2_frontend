// Mock data for development or when backend is unavailable
import { Advertisement } from '../services/advertisementService';

export interface BreakingNewsItem {
  _id: string;
  title: string;
  content?: string;
  path: string;
  language: 'hindi' | 'english';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock breaking news data
export const mockBreakingNews: { news: BreakingNewsItem[] } = {
  news: [
    {
      _id: 'bn1',
      title: 'Supreme Court issues new guidelines on election campaigns',
      path: '/article/supreme-court-election-guidelines',
      language: 'english',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn2',
      title: 'Prime Minister launches national healthcare initiative',
      path: '/article/pm-healthcare-initiative',
      language: 'english',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn3',
      title: 'Major technological breakthrough announced by Indian scientists',
      path: '/article/tech-breakthrough-indian-scientists',
      language: 'english',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn4',
      title: 'Stock market hits all-time high amid economic recovery',
      path: '/article/stock-market-record',
      language: 'english',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn5',
      title: 'सुप्रीम कोर्ट ने चुनाव अभियानों पर नए दिशानिर्देश जारी किए',
      path: '/article/supreme-court-election-guidelines',
      language: 'hindi',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn6',
      title: 'प्रधानमंत्री ने राष्ट्रीय स्वास्थ्य पहल की शुरुआत की',
      path: '/article/pm-healthcare-initiative',
      language: 'hindi',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn7',
      title: 'भारतीय वैज्ञानिकों द्वारा प्रमुख तकनीकी सफलता की घोषणा',
      path: '/article/tech-breakthrough-indian-scientists',
      language: 'hindi',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'bn8',
      title: 'आर्थिक सुधार के बीच शेयर बाजार ने सर्वकालिक उच्च स्तर छुआ',
      path: '/article/stock-market-record',
      language: 'hindi',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Mock advertisement data
export const mockAdvertisements: Advertisement[] = [
  {
    _id: 'ad1',
    title: 'Premium Smartphone Launch',
    imageUrl: 'https://placehold.co/970x90/3b82f6/ffffff?text=Premium+Smartphone',
    targetUrl: 'https://example.com/phone',
    position: 'header',
    displayOnPages: ['home', 'article'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isActive: true,
    impressions: 1234,
    clicks: 56,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ad2',
    title: 'Luxury Car Promotion',
    imageUrl: 'https://placehold.co/300x250/3b82f6/ffffff?text=Luxury+Car+Promotion',
    targetUrl: 'https://example.com/car',
    position: 'sidebar',
    displayOnPages: ['home', 'category'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    impressions: 2345,
    clicks: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ad3',
    title: 'Travel Package Deals',
    imageUrl: 'https://placehold.co/728x90/3b82f6/ffffff?text=Travel+Package+Deals',
    targetUrl: 'https://example.com/travel',
    position: 'breaking-news',
    displayOnPages: ['home'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    impressions: 3456,
    clicks: 123,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ad4',
    title: 'Online Education Courses',
    imageUrl: 'https://placehold.co/728x90/22c55e/ffffff?text=Online+Education+Courses',
    targetUrl: 'https://example.com/education',
    position: 'in-article',
    displayOnPages: ['article', 'category'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    impressions: 5678,
    clicks: 234,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ad5',
    title: 'Financial Services',
    imageUrl: 'https://placehold.co/970x250/f59e0b/ffffff?text=Financial+Services',
    targetUrl: 'https://example.com/finance',
    position: 'footer',
    displayOnPages: ['home', 'article', 'category'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    impressions: 7890,
    clicks: 345,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ad6',
    title: 'Streaming Service Subscription',
    imageUrl: 'https://placehold.co/970x250/ef4444/ffffff?text=Streaming+Service',
    targetUrl: 'https://example.com/streaming',
    position: 'category-header',
    displayOnPages: ['category'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    impressions: 4321,
    clicks: 210,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
