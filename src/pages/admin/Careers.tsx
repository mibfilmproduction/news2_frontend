import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  Edit,
  PlusCircle,
  Search,
  Trash2,
  Award,
  Users,
  FileText,
  Eye,
  Check,
  X,
  BarChart4,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

import { 
  getAllJobs, 
  getJobApplications, 
  getApplicationStats, 
  Job,
  JobApplication 
} from '@/services/careerService';

import JobForm from '@/components/admin/careers/JobForm';
import JobDetails from '@/components/admin/careers/JobDetails';
import ApplicationDetails from '@/components/admin/careers/ApplicationDetails';
import JobStatistics from '@/components/admin/careers/StatisticsCard';

const Careers: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("jobs");
  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  
  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Modal states
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);

  // Load jobs on mount
  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    }
  }, [activeTab]);

  // Load applications on mount or tab change
  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  // Load stats on mount or tab change
  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await getAllJobs();
      setJobs(response.jobs || []);
    } catch (err: any) {
      setJobsError(err.message || 'Failed to load jobs');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs. Please try again."
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const response = await getJobApplications();
      setApplications(response.applications || []);
    } catch (err: any) {
      setAppsError(err.message || 'Failed to load applications');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load applications. Please try again."
      });
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getApplicationStats();
      setStats(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load statistics. Please try again."
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateJob = () => {
    setSelectedJob(null);
    setIsJobFormOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setIsJobFormOpen(true);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const handleViewApplication = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsApplicationDetailOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'closed':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getApplicationStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'reviewing':
        return 'default';
      case 'shortlisted':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'hired':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const jobsSuccessfullyFetched = !jobsLoading && !jobsError && jobs.length > 0;
  const applicationsSuccessfullyFetched = !appsLoading && !appsError && applications.length > 0;

  return (
    <div className="p-6">
      <SEO title="Career Management" noIndex />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Career Management</h1>
        <Button onClick={handleCreateJob}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Job
        </Button>
      </div>

      <Tabs defaultValue="jobs" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="jobs">Job Listings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Listings</CardTitle>
              <CardDescription>
                Manage your career opportunities and job postings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="py-20 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : jobsError ? (
                <div className="text-center py-8 text-red-500">{jobsError}</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No job listings found. Click "Add New Job" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Posted Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job._id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.department}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>{job.type}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(job.status)}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(job.postedAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handleViewJob(job)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>
                Review and manage applications submitted by candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="py-20 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : appsError ? (
                <div className="text-center py-8 text-red-500">{appsError}</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No applications have been submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Job Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => {
                        const job = jobs.find(j => j._id === application.jobId);
                        return (
                          <TableRow key={application._id}>
                            <TableCell className="font-medium">{application.fullName}</TableCell>
                            <TableCell>{application.email}</TableCell>
                            <TableCell>{job?.title || 'Unknown Position'}</TableCell>
                            <TableCell>
                              <Badge variant={getApplicationStatusBadgeVariant(application.status)}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(application.appliedAt)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleViewApplication(application)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Career Statistics</CardTitle>
              <CardDescription>
                Overview of job positions and applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="py-20 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : !stats ? (
                <div className="text-center py-8 text-red-500">Failed to load statistics</div>
              ) : (
                <div className="space-y-6">
                  <JobStatistics stats={{
                    totalJobs: stats?.totalJobs || 0,
                    activeJobs: stats?.activeJobs || 0,
                    totalApplications: stats?.totalApplications || 0,
                    recentApplications: stats?.recentApplications || 0,
                    popularDepartments: stats?.popularDepartments || [],
                    applicationsByStatus: stats?.applicationsByStatus || {
                      pending: 0,
                      reviewing: 0,
                      shortlisted: 0,
                      rejected: 0,
                      hired: 0
                    }
                  }} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Most Applied Jobs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Most Applied Jobs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stats.popularJobs && stats.popularJobs.length > 0 ? (
                          <div className="space-y-4">
                            {stats.popularJobs.map((jobStat: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{jobStat.title}</p>
                                  <p className="text-sm text-gray-500">{jobStat.department}</p>
                                </div>
                                <Badge variant="outline" className="ml-auto">
                                  {jobStat.applicationCount} applications
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No application data available yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stats.recentActivity && stats.recentActivity.length > 0 ? (
                          <div className="space-y-4">
                            {stats.recentActivity.map((activity: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{activity.description}</p>
                                  <p className="text-sm text-gray-500">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {formatDate(activity.date)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No recent activity to display
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Form Modal */}
      {isJobFormOpen && (
        <JobForm 
          job={selectedJob}
          isOpen={isJobFormOpen}
          onClose={() => setIsJobFormOpen(false)}
          onSuccess={() => {
            setIsJobFormOpen(false);
            fetchJobs();
          }}
        />
      )}

      {/* Job Details Modal */}
      {isJobDetailOpen && selectedJob && (
        <JobDetails
          job={selectedJob}
          isOpen={isJobDetailOpen}
          onClose={() => setIsJobDetailOpen(false)}
          onEdit={() => {
            setIsJobDetailOpen(false);
            handleEditJob(selectedJob);
          }}
        />
      )}

      {/* Application Details Modal */}
      {isApplicationDetailOpen && selectedApplication && (
        <ApplicationDetails
          application={selectedApplication}
          job={jobs.find(j => j._id === selectedApplication.jobId) || null}
          isOpen={isApplicationDetailOpen}
          onClose={() => setIsApplicationDetailOpen(false)}
          onStatusChange={() => {
            fetchApplications();
          }}
        />
      )}
    </div>
  );
};

export default Careers;
