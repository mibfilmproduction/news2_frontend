import api from './api';

// Mock data for development
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

const MOCK_JOBS: Job[] = [
  {
    _id: '1',
    title: 'Senior News Editor',
    department: 'Editorial',
    location: 'New Delhi, India',
    type: 'Full-Time',
    description: 'We are seeking an experienced Senior News Editor to lead our editorial team. The ideal candidate will have a strong background in journalism, excellent editorial judgment, and the ability to manage a team of reporters and editors.',
    requirements: [
      "Bachelor's degree in Journalism, Communications, or related field",
      "Minimum of 5 years experience in news editing",
      "Excellent command of English language and grammar",
      "Experience managing editorial teams",
      "Strong news judgment and attention to detail"
    ],
    responsibilities: [
      'Oversee daily news operations and content strategy',
      'Edit articles for clarity, accuracy, and adherence to style guidelines',
      'Manage a team of reporters and junior editors',
      'Ensure all content meets journalistic standards and legal requirements',
      'Develop and implement editorial policies'
    ],
    experience: '5+ years',
    education: "Bachelor's degree",
    status: 'active',
    deadline: new Date(2026, 5, 30).toISOString(),
    postedAt: new Date(2025, 4, 1).toISOString(),
    updatedAt: new Date(2025, 4, 1).toISOString(),
    slug: 'senior-news-editor',
    salary: {
      min: 80000,
      max: 100000,
      currency: 'INR'
    }
  },
  {
    _id: '2',
    title: 'Video Journalist',
    department: 'Content Creation',
    location: 'Mumbai, India',
    type: 'Full-Time',
    description: 'We are looking for a creative and skilled Video Journalist to produce compelling video content for our digital platforms. The ideal candidate should have experience in video production, editing, and storytelling.',
    requirements: [
      "Bachelor's degree in Journalism, Film, or related field",
      "Minimum of 3 years experience in video journalism",
      "Proficiency in video editing software like Adobe Premiere Pro",
      "Strong storytelling abilities",
      "Knowledge of digital media trends"
    ],
    responsibilities: [
      'Shoot, edit, and produce original video content',
      'Conduct interviews and develop story ideas',
      'Collaborate with reporters and editors on multimedia projects',
      'Ensure videos meet quality standards and audience needs',
      'Stay updated on latest video production techniques'
    ],
    experience: '3+ years',
    education: "Bachelor's degree",
    status: 'active',
    postedAt: new Date(2025, 3, 15).toISOString(),
    updatedAt: new Date(2025, 3, 15).toISOString(),
    slug: 'video-journalist',
    salary: {
      min: 60000,
      max: 75000,
      currency: 'INR'
    }
  },
  {
    _id: '3',
    title: 'Web Developer',
    department: 'Technology',
    location: 'Remote',
    type: 'Full-Time',
    description: 'We are seeking a skilled Web Developer to join our technology team. The ideal candidate will have experience building and maintaining modern web applications and working with content management systems.',
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "Minimum of 3 years experience in web development",
      "Proficiency in JavaScript, React, and Node.js",
      "Experience with content management systems",
      "Understanding of responsive design principles"
    ],
    responsibilities: [
      'Develop and maintain our news websites and applications',
      'Implement new features and functionality',
      'Optimize website performance and user experience',
      'Collaborate with design and editorial teams',
      'Troubleshoot and fix bugs as needed'
    ],
    experience: '3+ years',
    education: "Bachelor's degree",
    status: 'active',
    postedAt: new Date(2025, 4, 10).toISOString(),
    updatedAt: new Date(2025, 4, 10).toISOString(),
    slug: 'web-developer'
  },
  {
    _id: '4',
    title: 'Social Media Manager',
    department: 'Marketing',
    location: 'Bangalore, India',
    type: 'Part-Time',
    description: 'We are looking for a Social Media Manager to develop and implement our social media strategy. The ideal candidate will have experience growing social media presence for news organizations or media companies.',
    requirements: [
      "Bachelor's degree in Marketing, Communications, or related field",
      "Minimum of 2 years experience in social media management",
      "Knowledge of social media platforms and analytics",
      "Strong writing and communication skills",
      "Understanding of news media industry"
    ],
    responsibilities: [
      'Develop and manage social media content calendar',
      'Create engaging content for various platforms',
      'Monitor social media performance and engagement',
      'Stay updated on social media trends and best practices',
      'Work with editorial team to promote content effectively'
    ],
    experience: '2+ years',
    education: "Bachelor's degree",
    status: 'active',
    deadline: new Date(2025, 5, 15).toISOString(),
    postedAt: new Date(2025, 4, 5).toISOString(),
    updatedAt: new Date(2025, 4, 5).toISOString(),
    slug: 'social-media-manager',
    salary: {
      min: 40000,
      max: 50000,
      currency: 'INR'
    }
  },
  {
    _id: '5',
    title: 'Investigative Reporter',
    department: 'Editorial',
    location: 'New Delhi, India',
    type: 'Full-Time',
    description: 'We are seeking an experienced Investigative Reporter to join our award-winning team. The ideal candidate will have a track record of producing impactful investigative journalism and the ability to develop and pursue original story ideas.',
    requirements: [
      "Bachelor's degree in Journalism or related field",
      "Minimum of 4 years experience in investigative reporting",
      "Strong research and interviewing skills",
      "Experience with data journalism",
      "Ability to work on long-term projects"
    ],
    responsibilities: [
      'Develop and pursue original investigative stories',
      'Conduct in-depth research and interviews',
      'Analyze data and documents for newsworthiness',
      'Collaborate with editors, photographers, and designers',
      'Maintain high standards of accuracy and ethics'
    ],
    experience: '4+ years',
    education: "Bachelor's degree",
    status: 'active',
    postedAt: new Date(2025, 3, 20).toISOString(),
    updatedAt: new Date(2025, 3, 20).toISOString(),
    slug: 'investigative-reporter',
    salary: {
      min: 70000,
      max: 85000,
      currency: 'INR'
    }
  }
];

const MOCK_APPLICATIONS: JobApplication[] = [
  {
    _id: '1',
    jobId: '1',
    fullName: 'Rajiv Kumar',
    email: 'rajiv.kumar@example.com',
    phone: '+91 98765 43210',
    resumeUrl: 'uploads/resumes/rajiv_kumar_resume.pdf',
    coverLetter: 'I am writing to apply for the Senior News Editor position. With over 7 years of experience in news editing and team management, I believe I would be a great fit for this role.',
    experience: '7 years experience in news editing at The Delhi Chronicle and India Today',
    education: "Master's in Journalism from Delhi University",
    status: 'reviewing',
    appliedAt: new Date(2025, 4, 5).toISOString(),
    updatedAt: new Date(2025, 4, 6).toISOString(),
  },
  {
    _id: '2',
    jobId: '1',
    fullName: 'Priya Singh',
    email: 'priya.singh@example.com',
    phone: '+91 98765 12345',
    resumeUrl: 'uploads/resumes/priya_singh_resume.pdf',
    coverLetter: 'I am excited to apply for the Senior News Editor position. With my 6 years of experience in news media and strong editorial skills, I believe I can make a valuable contribution to your team.',
    experience: '6 years in editorial roles at News18 and NDTV',
    education: "Bachelor's in Mass Communication from Mumbai University",
    status: 'shortlisted',
    appliedAt: new Date(2025, 4, 3).toISOString(),
    updatedAt: new Date(2025, 4, 7).toISOString(),
  },
  {
    _id: '3',
    jobId: '2',
    fullName: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    phone: '+91 87654 32109',
    resumeUrl: 'uploads/resumes/arjun_patel_resume.pdf',
    coverLetter: 'I am applying for the Video Journalist position. With my background in documentary filmmaking and news production, I am confident in my ability to create compelling video content for your platforms.',
    experience: '4 years as a video producer at Zee News and independent filmmaker',
    education: 'Film and Television Institute of India, Pune',
    status: 'pending',
    appliedAt: new Date(2025, 4, 10).toISOString(),
    updatedAt: new Date(2025, 4, 10).toISOString(),
  }
];

const MOCK_STATS = {
  totalJobs: 5,
  activeJobs: 5,
  totalApplications: 3,
  recentApplications: 3,
  applicationsByStatus: {
    pending: 1,
    reviewing: 1,
    shortlisted: 1,
    rejected: 0,
    hired: 0
  },
  popularDepartments: [
    { department: 'Editorial', count: 2, percentage: 40 },
    { department: 'Content Creation', count: 1, percentage: 20 },
    { department: 'Technology', count: 1, percentage: 20 },
    { department: 'Marketing', count: 1, percentage: 20 }
  ],
  popularJobs: [
    { title: 'Senior News Editor', department: 'Editorial', applicationCount: 2 },
    { title: 'Video Journalist', department: 'Content Creation', applicationCount: 1 }
  ],
  recentActivity: [
    { description: 'Application received for Video Journalist', date: new Date(2025, 4, 10).toISOString() },
    { description: 'Candidate shortlisted for Senior News Editor', date: new Date(2025, 4, 7).toISOString() },
    { description: 'Application status updated to reviewing', date: new Date(2025, 4, 6).toISOString() }
  ]
};

// Career job interface
export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string; // full-time, part-time, contract, etc.
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
    if (USE_MOCK_DATA) {
      // Apply filters to mock data
      let filteredJobs = [...MOCK_JOBS];
      
      if (params?.status) {
        filteredJobs = filteredJobs.filter(job => job.status === params.status);
      }
      
      if (params?.department) {
        filteredJobs = filteredJobs.filter(job => job.department === params.department);
      }
      
      // Sort by posted date (newest first)
      filteredJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      
      return {
        jobs: filteredJobs,
        total: filteredJobs.length,
        page: params?.page || 1,
        limit: params?.limit || filteredJobs.length
      };
    } else {
      try {
        const response = await api.get(`/careers/jobs`, { params });
        return response.data;
      } catch (error) {
        console.log('Error fetching jobs from API, falling back to mock data:', error);
        
        // Apply filters to mock data as fallback
        let filteredJobs = [...MOCK_JOBS];
        
        if (params?.status) {
          filteredJobs = filteredJobs.filter(job => job.status === params.status);
        }
        
        if (params?.department) {
          filteredJobs = filteredJobs.filter(job => job.department === params.department);
        }
        
        // Sort by posted date (newest first)
        filteredJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
        
        return {
          jobs: filteredJobs,
          total: filteredJobs.length,
          page: params?.page || 1,
          limit: params?.limit || filteredJobs.length
        };
      }
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get a single job by ID or slug
export const getJob = async (idOrSlug: string) => {
  try {
    if (USE_MOCK_DATA) {
      const job = MOCK_JOBS.find(j => j._id === idOrSlug || j.slug === idOrSlug);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      return job;
    } else {
      const response = await api.get(`/careers/jobs/${idOrSlug}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching job ${idOrSlug}:`, error);
    throw error;
  }
};

// Create a new job (admin only)
export const createJob = async (jobData: Omit<Job, '_id' | 'postedAt' | 'updatedAt' | 'slug'>) => {
  try {
    if (USE_MOCK_DATA) {
      // Generate a new ID
      const id = Math.max(...MOCK_JOBS.map(j => parseInt(j._id))) + 1;
      
      // Create a new job object
      const newJob: Job = {
        _id: id.toString(),
        ...jobData,
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Generate a slug if not provided in original data
        slug: jobData.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
      };
      
      // Add to mock jobs
      MOCK_JOBS.unshift(newJob);
      
      return newJob;
    } else {
      const response = await api.post(`/careers/jobs`, jobData);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update an existing job (admin only)
export const updateJob = async (jobId: string, jobData: Partial<Job>) => {
  try {
    if (USE_MOCK_DATA) {
      const index = MOCK_JOBS.findIndex(j => j._id === jobId);
      
      if (index === -1) {
        throw new Error('Job not found');
      }
      
      // Update the job
      MOCK_JOBS[index] = {
        ...MOCK_JOBS[index],
        ...jobData,
        updatedAt: new Date().toISOString()
      };
      
      return MOCK_JOBS[index];
    } else {
      const response = await api.put(`/careers/jobs/${jobId}`, jobData);
      return response.data;
    }
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
    throw error;
  }
};

// Delete a job (admin only)
export const deleteJob = async (jobId: string) => {
  try {
    if (USE_MOCK_DATA) {
      const index = MOCK_JOBS.findIndex(j => j._id === jobId);
      
      if (index === -1) {
        throw new Error('Job not found');
      }
      
      // Remove the job
      const deletedJob = MOCK_JOBS.splice(index, 1)[0];
      
      return { success: true, job: deletedJob };
    } else {
      const response = await api.delete(`/careers/jobs/${jobId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error);
    throw error;
  }
};

// Change job status (admin only)
export const changeJobStatus = async (jobId: string, status: 'active' | 'closed' | 'draft') => {
  try {
    if (USE_MOCK_DATA) {
      const index = MOCK_JOBS.findIndex(j => j._id === jobId);
      
      if (index === -1) {
        throw new Error('Job not found');
      }
      
      // Update the status
      MOCK_JOBS[index].status = status;
      MOCK_JOBS[index].updatedAt = new Date().toISOString();
      
      return MOCK_JOBS[index];
    } else {
      const response = await api.patch(`/careers/jobs/${jobId}/status`, { status });
      return response.data;
    }
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
    if (USE_MOCK_DATA) {
      // Check if job exists
      const job = MOCK_JOBS.find(j => j._id === jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      // Generate a new application ID
      const id = MOCK_APPLICATIONS.length > 0 
        ? (Math.max(...MOCK_APPLICATIONS.map(a => parseInt(a._id))) + 1).toString()
        : '1';
      
      // Create a new application
      const newApplication: JobApplication = {
        _id: id,
        jobId,
        ...applicationData,
        resumeUrl: `uploads/resumes/resume_${id}_${Date.now()}.pdf`,
        coverLetter: applicationData.coverLetter || "", // Ensure coverLetter is not undefined
        experience: applicationData.experience || "", // Ensure experience is not undefined
        education: applicationData.education || "", // Ensure education is not undefined
        status: 'pending',
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to mock applications
      MOCK_APPLICATIONS.push(newApplication);
      
      return { success: true, application: newApplication };
    } else {
      const formData = new FormData();
      
      // Append application data
      Object.entries(applicationData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Append resume file
      formData.append('resume', resumeFile);
      
      const response = await api.post(
        `/careers/jobs/${jobId}/apply`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    }
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
    if (USE_MOCK_DATA) {
      // Apply filters
      let filteredApplications = [...MOCK_APPLICATIONS];
      
      if (params?.jobId) {
        filteredApplications = filteredApplications.filter(app => app.jobId === params.jobId);
      }
      
      if (params?.status) {
        filteredApplications = filteredApplications.filter(app => app.status === params.status);
      }
      
      // Sort by applied date (newest first)
      filteredApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      
      return {
        applications: filteredApplications,
        total: filteredApplications.length,
        page: params?.page || 1,
        limit: params?.limit || filteredApplications.length
      };
    } else {
      const response = await api.get(`/careers/applications`, { params });
      return response.data;
    }
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
    if (USE_MOCK_DATA) {
      const index = MOCK_APPLICATIONS.findIndex(a => a._id === applicationId);
      
      if (index === -1) {
        throw new Error('Application not found');
      }
      
      // Update the status
      MOCK_APPLICATIONS[index].status = status;
      MOCK_APPLICATIONS[index].updatedAt = new Date().toISOString();
      
      // Add to recent activity in stats
      MOCK_STATS.recentActivity.unshift({
        description: `Application status updated to ${status}`,
        date: new Date().toISOString()
      });
      
      // Keep only the top 5 recent activities
      if (MOCK_STATS.recentActivity.length > 5) {
        MOCK_STATS.recentActivity = MOCK_STATS.recentActivity.slice(0, 5);
      }
      
      // Update stats
      updateMockApplicationStatusStats();
      
      return MOCK_APPLICATIONS[index];
    } else {
      const response = await api.patch(
        `/careers/applications/${applicationId}/status`,
        { status }
      );
      return response.data;
    }
  } catch (error) {
    console.error(`Error updating application status ${applicationId}:`, error);
    throw error;
  }
};

// Helper function to update mock application status stats
const updateMockApplicationStatusStats = () => {
  // Count applications by status
  const statusCounts = {
    pending: 0,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  };
  
  MOCK_APPLICATIONS.forEach(app => {
    statusCounts[app.status]++;
  });
  
  MOCK_STATS.applicationsByStatus = statusCounts;
};

// Get application statistics (admin only)
export const getApplicationStats = async () => {
  try {
    if (USE_MOCK_DATA) {
      // Update any dynamic stats
      MOCK_STATS.totalJobs = MOCK_JOBS.length;
      MOCK_STATS.activeJobs = MOCK_JOBS.filter(job => job.status === 'active').length;
      MOCK_STATS.totalApplications = MOCK_APPLICATIONS.length;
      
      // Calculate recent applications (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      MOCK_STATS.recentApplications = MOCK_APPLICATIONS.filter(
        app => new Date(app.appliedAt) >= sevenDaysAgo
      ).length;
      
      return MOCK_STATS;
    } else {
      const response = await api.get(`/careers/stats`);
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    throw error;
  }
};
