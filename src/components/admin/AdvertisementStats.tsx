import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAdvertisementStats } from "../../services/advertisementService";
import { Spinner } from "@/components/Spinner";

interface AdvertisementStatsProps {
  advertisementId: string;
}

// Mock data for chart visualization
// In a real implementation, you would fetch this from your API
const generateMockTimeseriesData = (impressions: number, clicks: number) => {
  const data = [];
  const now = new Date();
  const daysToShow = 15;
  
  for (let i = daysToShow; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate somewhat realistic data based on the totals
    const dayImpressions = Math.floor((impressions / daysToShow) * (0.7 + Math.random() * 0.6));
    const dayClicks = Math.floor((clicks / daysToShow) * (0.7 + Math.random() * 0.6));
    
    data.push({
      date: date.toISOString().substring(0, 10),
      impressions: dayImpressions,
      clicks: dayClicks,
      ctr: dayImpressions > 0 ? (dayClicks / dayImpressions) * 100 : 0
    });
  }
  
  return data;
};

const AdvertisementStats: React.FC<AdvertisementStatsProps> = ({ advertisementId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ad-stats", advertisementId],
    queryFn: () => getAdvertisementStats(advertisementId)
  });
  
  if (isLoading) return <Spinner size="lg" />;
  
  if (error) {
    return <div className="text-red-500">Error loading advertisement statistics</div>;
  }
  
  if (!data) {
    return <div className="text-gray-500">No statistics available</div>;
  }
  
  // Generate mock time series data based on the total stats
  // In a real implementation, you would fetch this data from your API
  const timeseriesData = generateMockTimeseriesData(data.impressions, data.clicks);
  
  // Metrics cards data
  const metrics = [
    { 
      name: "Impressions", 
      value: data.impressions.toLocaleString(), 
      description: "Number of times the ad was viewed" 
    },
    { 
      name: "Clicks", 
      value: data.clicks.toLocaleString(), 
      description: "Number of times the ad was clicked" 
    },
    { 
      name: "CTR", 
      value: `${data.ctr.toFixed(2)}%`, 
      description: "Click-through rate (clicks ÷ impressions)" 
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.name} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <h3 className="text-sm font-medium text-gray-500">{metric.name}</h3>
            <p className="text-2xl font-bold mt-1">{metric.value}</p>
            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
          </div>
        ))}
      </div>
      
      {/* Impressions & Clicks Over Time */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Performance Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeseriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Impressions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#82ca9d"
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* CTR Over Time */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-4">CTR Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeseriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(2)}%`, "CTR"]}
              />
              <Bar dataKey="ctr" fill="#ff7300" name="CTR (%)" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-700 mb-2">Performance Insights</h3>
        <p className="text-sm text-blue-600">
          {data.ctr < 1 
            ? "This advertisement has a lower than average CTR. Consider updating the creative or targeting different pages."
            : data.ctr < 2
            ? "This advertisement is performing at an average level. You might experiment with different creative elements to improve engagement."
            : "This advertisement is performing well with an above-average CTR. Consider increasing its visibility on more pages."}
        </p>
      </div>
    </div>
  );
};

export default AdvertisementStats;
