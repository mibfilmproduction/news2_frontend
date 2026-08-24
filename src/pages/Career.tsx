import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Briefcase,
  Clock,
  MapPin,
  Search,
  GraduationCap,
  Building,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { getAllJobs, Job } from '@/services/careerService';
import Spinner from '@/components/Spinner';

const Career: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Unique filter options
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getAllJobs({ status: 'active' });
        setJobs(response.jobs || []);
        setFilteredJobs(response.jobs || []);
        
        // Extract unique filter options
        if (response.jobs && response.jobs.length > 0) {
          const uniqueDepartments = [...new Set(response.jobs.map((job: Job) => job.department))] as string[];
          const uniqueLocations = [...new Set(response.jobs.map((job: Job) => job.location))] as string[];
          const uniqueTypes = [...new Set(response.jobs.map((job: Job) => job.type))] as string[];
          
          setDepartments(uniqueDepartments);
          setLocations(uniqueLocations);    
          setJobTypes(uniqueTypes);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    // Apply filters whenever any filter changes
    let result = jobs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.description.toLowerCase().includes(term)
      );
    }
    
    if (departmentFilter && departmentFilter !== 'all') {
      result = result.filter(job => job.department === departmentFilter);
    }
    
    if (locationFilter && locationFilter !== 'all') {
      result = result.filter(job => job.location === locationFilter);
    }
    
    if (typeFilter && typeFilter !== 'all') {
      result = result.filter(job => job.type === typeFilter);
    }
    
    setFilteredJobs(result);
  }, [jobs, searchTerm, departmentFilter, locationFilter, typeFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setLocationFilter('all');
    setTypeFilter('all');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <SEO
        title="Careers"
        description="Join our team at mibDaily News - View our current job openings and career opportunities in journalism, media and technology."
        url="/careers"
        keywords={['careers mibdaily', 'jobs in news', 'journalism jobs', 'media jobs', 'mibdaily']}
      />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover opportunities to work with one of the leading news media organizations.
          We're looking for talented individuals to help us deliver the news that matters.
        </p>
      </div>

      {/* Filter section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search and Filter Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for jobs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department">
                  {departmentFilter || (
                    <span className="flex items-center text-gray-500">
                      <Building className="mr-2 h-4 w-4" />
                      Department
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Location filter */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Location">
                  {locationFilter || (
                    <span className="flex items-center text-gray-500">
                      <MapPin className="mr-2 h-4 w-4" />
                      Location
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Job type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type">
                  {typeFilter || (
                    <span className="flex items-center text-gray-500">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Job Type
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear filters button */}
          {(searchTerm || departmentFilter || locationFilter || typeFilter) && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Job listings */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">
          {loading ? 'Loading opportunities...' : 
           error ? 'Current Openings' : 
           `Available Opportunities (${filteredJobs.length})`}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Jobs</h3>
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Jobs Found</h3>
              <p className="text-gray-500">
                {searchTerm || departmentFilter || locationFilter || typeFilter 
                  ? "No jobs match your current filters. Try adjusting your search criteria."
                  : "We don't have any open positions at the moment. Please check back later."}
              </p>
              {(searchTerm || departmentFilter || locationFilter || typeFilter) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                    <Badge variant={job.type === 'Full-Time' ? 'default' : 'outline'}>
                      {job.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 mt-2">
                    <div className="flex items-center">
                      <Building className="mr-1 h-4 w-4" />
                      {job.department}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="mr-1 h-4 w-4" />
                      {job.experience} exp
                    </div>
                    {job.deadline && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Apply by {formatDate(job.deadline)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3 mb-2">
                    {job.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-gray-500">
                    Posted: {formatDate(job.postedAt)}
                  </div>
                  <Link to={`/career/${job.slug}`}>
                    <Button>View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Why Join mibDaily News?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Innovation</h3>
              <p className="text-gray-600">
                Join a team that is constantly pushing the boundaries of digital journalism
                and embracing new technologies to deliver news in innovative ways.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Growth</h3>
              <p className="text-gray-600">
                We invest in our team's professional development with opportunities to
                learn new skills, attend conferences, and advance your career.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Impact</h3>
              <p className="text-gray-600">
                Make a real difference by helping to inform and educate our audience
                through high-quality, factual reporting on important issues.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Career;
