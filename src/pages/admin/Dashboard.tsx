import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Eye, FileText, Loader2, MessageSquare, Users } from "lucide-react";

interface DashboardOverview {
  counts: { articles: number; publishedArticles: number; draftArticles: number; categories: number; users: number; comments: number; totalViews: number };
  recentArticles: Array<{ _id: string; title: string; viewCount?: number; createdAt: string; status: string }>;
  topArticles: Array<{ _id: string; title: string; viewCount?: number }>;
}
interface ArticleView { date: string; count: number }
interface CategoryMetric { name: string; articleCount: number; viewCount: number }

const emptyOverview: DashboardOverview = {
  counts: { articles: 0, publishedArticles: 0, draftArticles: 0, categories: 0, users: 0, comments: 0, totalViews: 0 },
  recentArticles: [],
  topArticles: [],
};

const Dashboard = () => {
  const [overview, setOverview] = useState(emptyOverview);
  const [views, setViews] = useState<ArticleView[]>([]);
  const [categories, setCategories] = useState<CategoryMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        api.get<DashboardOverview>('/analytics/overview'),
        api.get<ArticleView[]>('/analytics/articles/views'),
        api.get<CategoryMetric[]>('/analytics/categories/performance'),
      ]);
      if (!active) return;
      const [overviewResult, viewsResult, categoriesResult] = results;
      if (overviewResult.status === 'fulfilled' && overviewResult.value.success && overviewResult.value.data) setOverview(overviewResult.value.data);
      else setError('Some dashboard data could not be loaded.');
      if (viewsResult.status === 'fulfilled' && viewsResult.value.success && Array.isArray(viewsResult.value.data)) setViews(viewsResult.value.data);
      if (categoriesResult.status === 'fulfilled' && categoriesResult.value.success && Array.isArray(categoriesResult.value.data)) {
        setCategories([...categoriesResult.value.data].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6));
      }
      setLoading(false);
    };
    load().catch(() => { if (active) { setError('Dashboard could not be loaded.'); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Articles', value: overview.counts.articles, detail: `${overview.counts.publishedArticles} published, ${overview.counts.draftArticles} drafts`, icon: FileText },
    { label: 'Total views', value: overview.counts.totalViews.toLocaleString(), detail: overview.topArticles[0]?.title || 'No top article yet', icon: Eye },
    { label: 'Users', value: overview.counts.users, detail: 'Registered users', icon: Users },
    { label: 'Categories', value: overview.counts.categories, detail: `${overview.counts.comments} comments`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Live content and audience overview</p></div>
      {error && <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{loading ? '—' : value}</p></div><Icon className="h-5 w-5 text-primary" /></div><p className="mt-3 truncate text-xs text-muted-foreground">{detail}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Article views</CardTitle><CardDescription>Daily views from the analytics API</CardDescription></CardHeader><CardContent className="h-72">
          {loading ? <Loading /> : views.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={views}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={shortDate} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" name="Views" stroke="#0070f3" strokeWidth={2} /></LineChart></ResponsiveContainer> : <Empty label="No view data available" />}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Category performance</CardTitle><CardDescription>Top categories by views</CardDescription></CardHeader><CardContent className="h-72">
          {loading ? <Loading /> : categories.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={categories}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="viewCount" name="Views" fill="#10b981" /></BarChart></ResponsiveContainer> : <Empty label="No category analytics available" />}
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Recent articles</CardTitle><CardDescription>Latest content returned by the server</CardDescription></CardHeader><CardContent>
        {loading ? <Loading /> : overview.recentArticles.length ? <div className="divide-y">{overview.recentArticles.map(article => <div key={article._id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate font-medium">{article.title}</p><p className="text-xs text-muted-foreground">{new Date(article.createdAt).toLocaleDateString()} · {article.viewCount || 0} views</p></div><Badge variant={article.status === 'published' ? 'default' : 'outline'}>{article.status}</Badge></div>)}</div> : <Empty label="No recent articles available" />}
      </CardContent></Card>
    </div>
  );
};

const Loading = () => <div className="flex h-full min-h-24 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
const Empty = ({ label }: { label: string }) => <div className="flex h-full min-h-24 items-center justify-center text-sm text-muted-foreground"><BarChart3 className="mr-2 h-4 w-4" />{label}</div>;
const shortDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : `${date.getDate()}/${date.getMonth() + 1}`; };

export default Dashboard;
