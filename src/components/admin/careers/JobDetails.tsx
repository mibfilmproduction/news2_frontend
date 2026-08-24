import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  GraduationCap,
  Building,
  Eye,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import { Job, changeJobStatus } from '@/services/careerService';
import { useToast } from "@/hooks/use-toast";

interface JobDetailsProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ 
  job, 
  isOpen, 
  onClose,
  onEdit
}) => {
  const { toast } = useToast();
  
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

  const handleStatusChange = async (newStatus: 'active' | 'closed' | 'draft') => {
    try {
      await changeJobStatus(job._id, newStatus);
      toast({
        title: "Status Updated",
        description: `Job status has been changed to ${newStatus}.`,
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update job status",
      });
    }
  };

  const handleViewOnSite = () => {
    const url = `/career/${job.slug}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{job.title}</DialogTitle>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{job.department}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{job.location}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{job.type}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Posted: {formatDate(job.postedAt)}</span>
            </div>
            
            {job.deadline && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Deadline: {formatDate(job.deadline)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Salary: {formatSalary(job.salary)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Experience: {job.experience || 'Not specified'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Education: {job.education || 'Not specified'}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-2">Job Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>
          
          {/* Requirements */}
          <div>
            <h3 className="text-lg font-medium mb-2">Requirements</h3>
            <ul className="list-disc pl-6 space-y-1">
              {job.requirements.map((req, index) => (
                <li key={index} className="text-gray-700">{req}</li>
              ))}
            </ul>
          </div>
          
          {/* Responsibilities */}
          <div>
            <h3 className="text-lg font-medium mb-2">Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-1">
              {job.responsibilities.map((resp, index) => (
                <li key={index} className="text-gray-700">{resp}</li>
              ))}
            </ul>
          </div>
          
          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
            <div>
              <h4 className="text-sm font-medium">URL Slug</h4>
              <p className="text-gray-700">{job.slug}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Last Updated</h4>
              <p className="text-gray-700">{formatDate(job.updatedAt)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOnSite}
            >
              <Eye className="h-4 w-4 mr-1" />
              View on Site
            </Button>
            
            {job.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('active')}
                className="text-green-600 hover:text-green-700"
              >
                Publish
              </Button>
            )}
            
            {job.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('closed')}
                className="text-red-600 hover:text-red-700"
              >
                Close
              </Button>
            )}
            
            {job.status === 'closed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('active')}
                className="text-green-600 hover:text-green-700"
              >
                Reopen
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="destructive" 
              size="sm"
              className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetails;
