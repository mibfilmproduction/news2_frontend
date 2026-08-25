import { careerApi } from '@/lib/api-client';

// Career job interface
export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  experience: string;
  education: string;
  status: 'active' | 'closed' | 'draft';
  deadline?: string;
  postedAt: string;
  updatedAt: string;
  slug: string;
}

// Job application interface
export interface JobApplication {
  _id: string;
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  experience: string;
  education: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  updatedAt: string;
}

// Get all jobs (with optional pagination and filters)
export const getAllJobs = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
}) => {
  try {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status) queryParams.status = params.status;
    if (params?.department) queryParams.department = params.department;

    const response = await careerApi.getCareers(queryParams);

    if (!response.success || !response.data) {
      return { jobs: [], total: 0, page: 1, limit: 10 };
    }

    const jobs = Array.isArray(response.data) ? response.data : response.data.data || [];

    return {
      jobs,
      total: response.data.total || jobs.length,
      page: params?.page || 1,
      limit: params?.limit || jobs.length,
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get a single job by ID or slug
export const getJob = async (idOrSlug: string) => {
  try {
    const response = await careerApi.getCareer(idOrSlug);
    if (!response.success || !response.data) {
      throw new Error('Job not found');
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${idOrSlug}:`, error);
    throw error;
  }
};

// Create a new job (admin only)
export const createJob = async (jobData: Omit<Job, '_id' | 'postedAt' | 'updatedAt' | 'slug'>) => {
  try {
    const response = await careerApi.createCareer(jobData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create job');
    }
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update an existing job (admin only)
export const updateJob = async (jobId: string, jobData: Partial<Job>) => {
  try {
    const response = await careerApi.updateCareer(jobId, jobData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update job');
    }
    return response.data;
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
    throw error;
  }
};

// Delete a job (admin only)
export const deleteJob = async (jobId: string) => {
  try {
    const response = await careerApi.deleteCareer(jobId);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete job');
    }
    return { success: true };
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error);
    throw error;
  }
};

// Change job status (admin only)
export const changeJobStatus = async (jobId: string, status: 'active' | 'closed' | 'draft') => {
  try {
    const response = await careerApi.updateCareer(jobId, { status });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to change job status');
    }
    return response.data;
  } catch (error) {
    console.error(`Error changing job status ${jobId}:`, error);
    throw error;
  }
};

// Submit a job application
export const submitJobApplication = async (
  jobId: string,
  applicationData: Omit<JobApplication, '_id' | 'jobId' | 'status' | 'appliedAt' | 'updatedAt'>,
  resumeFile: File
) => {
  try {
    const formData = new FormData();

    // Append application data
    Object.entries(applicationData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Append resume file
    formData.append('resume', resumeFile);

    const response = await careerApi.applyToCareer(jobId, formData);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to submit application');
    }

    return response.data;
  } catch (error) {
    console.error('Error submitting job application:', error);
    throw error;
  }
};

// Get all job applications (admin only)
export const getJobApplications = async (params?: {
  jobId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.jobId) queryParams.job = params.jobId;
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const response = await careerApi.getApplications?.(queryParams) ?? 
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/careers/applications?${new URLSearchParams(queryParams).toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      }).then(r => r.json());

    if (!response.success || !response.data) {
      return { applications: [], total: 0, page: 1, limit: 10 };
    }

    const applications = Array.isArray(response.data) ? response.data : response.data.data || [];

    return {
      applications,
      total: response.data.total || applications.length,
      page: params?.page || 1,
      limit: params?.limit || applications.length,
    };
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
};

// Update job application status (admin only)
export const updateApplicationStatus = async (
  applicationId: string,
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
) => {
  try {
    const response = await careerApi.updateApplicationStatus?.(applicationId, status) ??
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/careers/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status })
      }).then(r => r.json());

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update application status');
    }

    return response.data;
  } catch (error) {
    console.error(`Error updating application status ${applicationId}:`, error);
    throw error;
  }
};

// Get application statistics (admin only)
export const getApplicationStats = async () => {
  try {
    const response = await careerApi.getStats?.() ??
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/careers/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      }).then(r => r.json());

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch statistics');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    throw error;
  }
};