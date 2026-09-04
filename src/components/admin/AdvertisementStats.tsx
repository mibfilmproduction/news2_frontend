import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdvertisementStats } from "../../services/advertisementService";
import { Spinner } from "@/components/Spinner";

interface AdvertisementStatsProps { advertisementId: string; }

const AdvertisementStats: React.FC<AdvertisementStatsProps> = ({ advertisementId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ad-stats", advertisementId],
    queryFn: () => getAdvertisementStats(advertisementId),
    enabled: Boolean(advertisementId),
  });

  if (isLoading) return <Spinner size="lg" />;
  if (error) return <div role="alert" className="text-red-500">Error loading advertisement statistics</div>;
  if (!data) return <div className="text-gray-500">No statistics available</div>;

  const impressions = Number(data.impressions) || 0;
  const clicks = Number(data.clicks) || 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const metrics = [
    { name: "Impressions", value: impressions.toLocaleString(), description: "Number of times the ad was viewed" },
    { name: "Clicks", value: clicks.toLocaleString(), description: "Number of times the ad was clicked" },
    { name: "CTR", value: `${ctr.toFixed(2)}%`, description: "Click-through rate (clicks divided by impressions)" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">{metric.name}</h3>
            <p className="mt-1 text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500">Time-series charts will appear when daily analytics are available from the API.</p>
    </div>
  );
};

export default AdvertisementStats;
