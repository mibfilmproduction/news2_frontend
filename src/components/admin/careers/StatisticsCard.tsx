import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Users,
  BriefcaseBusiness,
  ListChecks,
} from "lucide-react";

interface StatisticProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  color?: string;
}

export const StatisticCard: React.FC<StatisticProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
  color = "bg-primary",
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`${color} bg-opacity-10 p-2 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center mt-4">
            <Badge 
              variant={trend === 'up' ? 'success' : trend === 'down' ? 'destructive' : 'secondary'}
              className="text-xs font-medium"
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface JobStatisticsProps {
  stats: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    recentApplications: number;
    popularDepartments: Array<{
      department: string;
      count: number;
      percentage: number;
    }>;
    applicationsByStatus: {
      pending: number;
      reviewing: number;
      shortlisted: number;
      rejected: number;
      hired: number;
    };
  };
}

const JobStatistics: React.FC<JobStatisticsProps> = ({ stats }) => {
  const totalApplications = stats.totalApplications || 0;
  const applicationPercentage = stats.applicationsByStatus || 
    { pending: 0, reviewing: 0, shortlisted: 0, rejected: 0, hired: 0 };
  
  const applicationStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    reviewing: 'bg-blue-500',
    shortlisted: 'bg-green-500',
    rejected: 'bg-red-500',
    hired: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Career Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={<BriefcaseBusiness className="h-5 w-5 text-primary" />}
          color="bg-primary"
        />
        
        <StatisticCard
          title="Active Postings"
          value={stats.activeJobs}
          description={`${Math.round((stats.activeJobs / stats.totalJobs) * 100)}% of all jobs`}
          icon={<ListChecks className="h-5 w-5 text-green-500" />}
          color="bg-green-500"
        />
        
        <StatisticCard
          title="Total Applications"
          value={totalApplications}
          description={totalApplications > 0 ? `${(totalApplications / stats.activeJobs).toFixed(1)} per job` : 'No applications yet'}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          color="bg-blue-500"
        />
        
        <StatisticCard
          title="Recent Applications"
          value={stats.recentApplications}
          description="In the last 7 days"
          icon={<BarChart className="h-5 w-5 text-purple-500" />}
          color="bg-purple-500"
          trend={stats.recentApplications > 5 ? 'up' : 'neutral'}
          trendValue={stats.recentApplications > 5 ? 'Active interest' : 'Normal activity'}
        />
      </div>
      
      {/* Application Status Breakdown */}
      {totalApplications > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Application Status Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(applicationPercentage).map(([status, count]) => {
              const percentage = totalApplications > 0 
                ? Math.round((count / totalApplications) * 100) 
                : 0;
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm capitalize font-medium">{status}</span>
                    <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${applicationStatusColors[status]} bg-opacity-20`} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Popular Departments */}
      {stats.popularDepartments && stats.popularDepartments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Popular Departments</h3>
          <div className="space-y-4">
            {stats.popularDepartments.slice(0, 5).map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{dept.department}</span>
                  <span className="text-sm text-muted-foreground">
                    {dept.count} ({dept.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={dept.percentage} 
                  className="h-2 bg-primary bg-opacity-20" 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobStatistics;
