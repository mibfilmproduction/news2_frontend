import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusCircle, 
  MinusCircle, 
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import { Job, createJob, updateJob } from '@/services/careerService';

interface JobFormProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JobForm: React.FC<JobFormProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-Time');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [hasSalary, setHasSalary] = useState(false);
  const [minSalary, setMinSalary] = useState<number | ''>('');
  const [maxSalary, setMaxSalary] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [status, setStatus] = useState<'active' | 'closed' | 'draft'>('draft');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [slug, setSlug] = useState('');

  // Available options
  const departmentOptions = [
    'Editorial', 
    'Technology', 
    'Marketing',
    'Operations',
    'Finance',
    'Human Resources',
    'Design',
    'Production',
    'Sales',
    'Research',
    'Administration',
    'Content Creation'
  ];
  
  const locationOptions = [
    'New Delhi, India',
    'Mumbai, India',
    'Bangalore, India',
    'Remote',
    'Hybrid',
  ];
  
  const jobTypeOptions = [
    'Full-Time',
    'Part-Time',
    'Contract',
    'Freelance',
    'Internship',
  ];
  
  // Initialize form with job data if editing
  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDepartment(job.department);
      setLocation(job.location);
      setJobType(job.type);
      setDescription(job.description);
      setRequirements(job.requirements.length > 0 ? job.requirements : ['']);
      setResponsibilities(job.responsibilities.length > 0 ? job.responsibilities : ['']);
      
      if (job.salary) {
        setHasSalary(true);
        setMinSalary(job.salary.min);
        setMaxSalary(job.salary.max);
        setCurrency(job.salary.currency);
      } else {
        setHasSalary(false);
      }
      
      setExperience(job.experience);
      setEducation(job.education);
      setStatus(job.status);
      
      if (job.deadline) {
        setHasDeadline(true);
        setDeadline(job.deadline.split('T')[0]); // Format YYYY-MM-DD
      } else {
        setHasDeadline(false);
      }
      
      setSlug(job.slug);
    }
  }, [job]);

  // Generate slug from title
  useEffect(() => {
    if (!job) { // Only auto-generate slug for new jobs
      setSlug(title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
      );
    }
  }, [title, job]);

  // Requirements array functions
  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      const newRequirements = [...requirements];
      newRequirements.splice(index, 1);
      setRequirements(newRequirements);
    }
  };

  // Responsibilities array functions
  const handleResponsibilityChange = (index: number, value: string) => {
    const newResponsibilities = [...responsibilities];
    newResponsibilities[index] = value;
    setResponsibilities(newResponsibilities);
  };

  const addResponsibility = () => {
    setResponsibilities([...responsibilities, '']);
  };

  const removeResponsibility = (index: number) => {
    if (responsibilities.length > 1) {
      const newResponsibilities = [...responsibilities];
      newResponsibilities.splice(index, 1);
      setResponsibilities(newResponsibilities);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a job title",
        variant: "destructive",
      });
      return;
    }
    
    if (!department) {
      toast({
        title: "Missing Information",
        description: "Please select a department",
        variant: "destructive",
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Missing Information",
        description: "Please specify a location",
        variant: "destructive",
      });
      return;
    }
    
    // Filter out empty requirements and responsibilities
    const filteredRequirements = requirements.filter(req => req.trim() !== '');
    const filteredResponsibilities = responsibilities.filter(resp => resp.trim() !== '');
    
    if (filteredRequirements.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one requirement",
        variant: "destructive",
      });
      return;
    }
    
    if (filteredResponsibilities.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one responsibility",
        variant: "destructive",
      });
      return;
    }
    
    // Validate salary if enabled
    if (hasSalary) {
      if (!minSalary || !maxSalary) {
        toast({
          title: "Invalid Salary Range",
          description: "Please specify both minimum and maximum salary",
          variant: "destructive",
        });
        return;
      }
      
      if (typeof minSalary === 'number' && typeof maxSalary === 'number' && minSalary > maxSalary) {
        toast({
          title: "Invalid Salary Range",
          description: "Minimum salary cannot be greater than maximum salary",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
      // Prepare job data
      const jobData: any = {
        title,
        department,
        location,
        type: jobType,
        description,
        requirements: filteredRequirements,
        responsibilities: filteredResponsibilities,
        experience,
        education,
        status,
        slug,
      };
      
      // Add salary if enabled
      if (hasSalary && minSalary !== '' && maxSalary !== '') {
        jobData.salary = {
          min: Number(minSalary),
          max: Number(maxSalary),
          currency,
        };
      }
      
      // Add deadline if enabled
      if (hasDeadline && deadline) {
        jobData.deadline = deadline;
      }
      
      // Create or update job
      if (job) {
        await updateJob(job._id, jobData);
        toast({
          title: "Success",
          description: "Job has been updated successfully",
        });
      } else {
        await createJob(jobData);
        toast({
          title: "Success",
          description: "New job has been created successfully",
        });
      }
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save job posting",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
          <DialogDescription>
            {job
              ? "Update the details of this job posting."
              : "Fill in the details to create a new job posting."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title*</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior News Editor"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department*</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location*</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type*</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status*</Label>
                  <Select value={status} onValueChange={(val: 'active' | 'closed' | 'draft') => setStatus(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active (Published)</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="job-posting-url-slug"
                />
                <p className="text-xs text-gray-500">
                  This will be used in the job posting URL. Leave empty to auto-generate from title.
                </p>
              </div>
            </div>
          </div>
          
          {/* Job Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Job Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">Job Description*</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the job..."
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Requirements*</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRequirement}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={req}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Responsibilities*</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResponsibility}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {responsibilities.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeResponsibility(index)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience Required</Label>
                <Input
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 3-5 years"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="education">Education Required</Label>
                <Input
                  id="education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. Bachelor's degree in Journalism"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="salary-toggle" className="cursor-pointer">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Specify Salary Range
                  </div>
                </Label>
                <Switch
                  id="salary-toggle"
                  checked={hasSalary}
                  onCheckedChange={setHasSalary}
                />
              </div>
              
              {hasSalary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="minSalary">Minimum</Label>
                    <Input
                      id="minSalary"
                      type="number"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxSalary">Maximum</Label>
                    <Input
                      id="maxSalary"
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 70000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="deadline-toggle" className="cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Application Deadline
                  </div>
                </Label>
                <Switch
                  id="deadline-toggle"
                  checked={hasDeadline}
                  onCheckedChange={setHasDeadline}
                />
              </div>
              
              {hasDeadline && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="deadline">Deadline Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Today's date as minimum
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  {job ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                job ? 'Update Job' : 'Create Job'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobForm;
