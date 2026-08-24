import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Share2,
  DollarSign,
  GraduationCap,
  Building,
  Upload,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { getJob, submitJobApplication, Job } from '@/services/careerService';
import Spinner from '@/components/Spinner';

const CareerDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  
  // Form states
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const jobData = await getJob(slug);
        setJob(jobData);
      } catch (err: any) {
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)} ${salary.currency === 'USD' ? 'per year' : ''}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for job data
    if (!job) {
      toast({
        title: 'Error',
        description: 'Job information is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for resume file
    if (!resumeFile) {
      toast({
        title: 'Missing Resume',
        description: 'Please upload your resume/CV.',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic validation
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    // File validation
    const validFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validFileTypes.includes(resumeFile.type)) {
      toast({
        title: 'Invalid File',
        description: 'Please upload your resume in PDF or Word format.',
        variant: 'destructive',
      });
      return;
    }
    
    if (resumeFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File Too Large',
        description: 'Resume file size should be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Create application data object with all required fields
      const applicationData = {
        fullName,
        email,
        phone,
        coverLetter: coverLetter || "", 
        experience: experience || "", 
        education: education || "",
        resumeUrl: "" // This will be replaced by the backend
      };
      
      await submitJobApplication(
        job._id,
        applicationData,
        resumeFile
      );
      
      setFormSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setIsApplyDialogOpen(false);
        setFormSuccess(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setResumeFile(null);
        setCoverLetter('');
        setExperience('');
        setEducation('');
      }, 3000);
      
    } catch (err: any) {
      toast({
        title: 'Application Failed',
        description: err.message || 'There was an error submitting your application. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleShareJob = () => {
    if (navigator.share && job) {
      navigator.share({
        title: `Job Opening: ${job.title} at Mibnews`,
        text: `Check out this job opportunity: ${job.title} at Mibnews`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers without navigator.share
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Job link has been copied to clipboard.',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto py-16 px-4">
        <SEO
          title="Careers"
          description="Job opportunities at mibDaily News - Join our team."
          url="/career"
          noIndex
        />
        
        <Card className="max-w-3xl mx-auto bg-red-50">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-2">Job Not Found</h1>
            <p className="text-red-600 mb-6">
              {error || "The job you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate('/career')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SEO
        title={`${job.title} - Careers`}
        description={`Apply for ${job.title} position at Mibnews - ${job.location}`}
        url={`/career/${job.slug || job._id}`}
        keywords={[job.title, `${job.title} job`, 'mibnews careers', 'news jobs', job.department || '']}
        type="article"
      />

      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/career')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Jobs
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-base">
                  <div className="flex flex-wrap gap-y-2 gap-x-4 mt-2">
                    <div className="flex items-center">
                      <Building className="mr-1 h-4 w-4" />
                      {job.department}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="mr-1 h-4 w-4" />
                      {job.type}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Posted: {formatDate(job.postedAt)}
                    </div>
                  </div>
                </CardDescription>
              </div>
              <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                {job.status === 'active' ? 'Active' : 'Closed'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">About This Role</h2>
              <p className="whitespace-pre-line">{job.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md">
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  Salary Range
                </h3>
                <p>{formatSalary(job.salary)}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <GraduationCap className="mr-1 h-4 w-4" />
                  Required Education
                </h3>
                <p>{job.education}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" />
                  Experience
                </h3>
                <p>{job.experience}</p>
              </div>
              {job.deadline && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Application Deadline
                  </h3>
                  <p>{formatDate(job.deadline)}</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Key Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                {job.responsibilities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Requirements</h2>
              <ul className="list-disc pl-6 space-y-2">
                {job.requirements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={handleShareJob}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Job
            </Button>
            
            {job.status === 'active' ? (
              <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">Apply Now</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  {formSuccess ? (
                    <div className="py-8 text-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <DialogTitle className="text-2xl mb-2">Application Submitted!</DialogTitle>
                      <DialogDescription className="text-base">
                        Thank you for applying to Mibnews. We've received your application
                        and will review it soon. We'll contact you if your qualifications match our needs.
                      </DialogDescription>
                    </div>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title}</DialogTitle>
                        <DialogDescription>
                          Complete the form below to submit your application. All fields marked with * are required.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmitApplication} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name*</Label>
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email*</Label>
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="johndoe@example.com"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number*</Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="resume">Resume/CV (PDF or Word)*</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              ref={fileInputRef}
                              id="resume"
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                              className="flex-1"
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Browse
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="coverLetter">Cover Letter</Label>
                          <Textarea
                            id="coverLetter"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Tell us why you're interested in this role and why you'd be a good fit..."
                            rows={4}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="experience">Work Experience</Label>
                            <Textarea
                              id="experience"
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              placeholder="Briefly describe your relevant work experience..."
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="education">Education</Label>
                            <Textarea
                              id="education"
                              value={education}
                              onChange={(e) => setEducation(e.target.value)}
                              placeholder="List your educational qualifications..."
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter className="pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsApplyDialogOpen(false)}
                            disabled={formSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={formSubmitting}>
                            {formSubmitting ? (
                              <>
                                <Spinner className="mr-2" size="sm" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="lg" disabled>
                Applications Closed
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            At Mibnews, we're always looking for passionate, talented people to join our team
            and help us deliver quality news and information to our audience.
          </p>
          <Button variant="outline" onClick={() => navigate('/career')}>
            View All Openings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetail;
