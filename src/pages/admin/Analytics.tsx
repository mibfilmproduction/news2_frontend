import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart
} from "recharts";
import api from "@/services/api";

interface OverviewData {
  counts: {
    articles: number;
    publishedArticles: number;
    draftArticles: number;
    categories: number;
    users: number;
    comments: number;
    totalViews: number;
  };
  topArticles: Array<{
    _id: string;
    title: string;
    viewCount: number;
    createdAt: string;
  }>;
}

interface ViewsDatum {
  date: string;
  count: number;
  articles: number;
}

interface CategoryDatum {
  _id: string;
  name: string;
  articleCount: number;
  viewCount: number;
  averageViews: number;
}

interface UserActivityDatum {
  month: string;
  count: number;
}

const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30 | 90>(14);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [viewsData, setViewsData] = useState<ViewsDatum[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDatum[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityDatum[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, viewsRes, categoriesRes, usersRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/articles/views', { params: { days: timeRange } }),
        api.get('/analytics/categories/performance'),
        api.get('/analytics/users/activity'),
      ]);

      setOverview(overviewRes.data?.data || null);
      setViewsData(viewsRes.data?.data || []);
      setCategoryData(categoriesRes.data?.data || []);
      setUserActivity(usersRes.data?.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = overview?.counts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {([7, 14, 30, 90] as const).map((days) => (
            <Badge
              key={days}
              variant={timeRange === days ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange(days)}
            >
              {days} Days
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatNumber(counts?.totalViews || 0)}</div>
                <p className="text-xs text-muted-foreground">Total Article Views</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{counts?.publishedArticles || 0}</div>
                <p className="text-xs text-muted-foreground">Published Articles</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{counts?.draftArticles || 0}</div>
                <p className="text-xs text-muted-foreground">Draft Articles</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{counts?.users || 0}</div>
                <p className="text-xs text-muted-foreground">Registered Users</p>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Overview */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>Article views per day (last {timeRange} days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={viewsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="pageViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => formatNumber(v)} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#pageViews)"
                        name="Article Views"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category performance & user growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Views by content category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(v: number) => formatNumber(v)} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="viewCount" name="Total Views" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New registered users per month (last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={userActivity}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="New Users"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Articles</CardTitle>
              <CardDescription>Articles with the most views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Views</th>
                      <th className="text-left py-3 px-4">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.topArticles || []).map((article) => (
                      <tr key={article._id} className="border-b">
                        <td className="py-3 px-4">{article.title}</td>
                        <td className="py-3 px-4">{formatNumber(article.viewCount)}</td>
                        <td className="py-3 px-4">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {(overview?.topArticles || []).length === 0 && (
                      <tr>
                        <td className="py-6 px-4 text-center text-muted-foreground" colSpan={3}>
                          No articles published yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;