import { api } from '@/lib/api-client';

export interface NotificationType {
  _id: string;
  title: string;
  message: string;
  type: 'breaking' | 'article' | 'live' | 'sports' | 'general';
  link?: string;
  createdAt: string;
}

const READ_KEY = 'mibnews-read-notifications';

export const getReadIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  } catch {
    return [];
  }
};

export const markAllAsRead = (): void => {
  try {
    const ids = notificationsCache.map((n) => n._id);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {}
};

let notificationsCache: NotificationType[] = [];

export const fetchNotifications = async (limit = 20): Promise<NotificationType[]> => {
  try {
    const res = await api.get<NotificationType[]>('/notifications', { limit }, { requireAuth: false });
    const list = Array.isArray(res.data) ? res.data : [];
    // Fallback: if backend has no notifications yet, derive from breaking news
    if (list.length > 0) {
      notificationsCache = list;
      return list;
    }
  } catch {
    // fall through to breaking-news fallback below
  }
  try {
    const breaking = await api.get<any[]>('/news/breaking', { limit: 10 }, { requireAuth: false });
    const articles = Array.isArray(breaking.data) ? breaking.data : [];
    const fallback: NotificationType[] = articles.slice(0, limit).map((a: any) => ({
      _id: a._id,
      title: 'Breaking News',
      message: a.title,
      type: 'breaking' as const,
      link: a.slug ? `/article/${a.slug}` : `/article/${a._id}`,
      createdAt: a.createdAt || a.updatedAt || new Date().toISOString(),
    }));
    notificationsCache = fallback;
    return fallback;
  } catch {
    return notificationsCache;
  }
};

export const getUnreadCount = (list: NotificationType[]): number => {
  const read = new Set(getReadIds());
  return list.filter((n) => !read.has(n._id)).length;
};
