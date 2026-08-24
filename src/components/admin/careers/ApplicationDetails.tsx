import React, { useState } from 'react';
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
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  Check,
  X,
  ClipboardList,
  Briefcase,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { JobApplication, updateApplicationStatus, Job } from '@/services/careerService';
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface ApplicationDetailsProps {
  application: JobApplication;
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  application,
  job,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>(application.status);
  const [updating, setUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
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

  const handleStatusChange = async () => {
    if (status === application.status) return;

    try {
      setUpdating(true);
      await updateApplicationStatus(
        application._id, 
        status as 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
      );
      
      toast({
        title: "Status Updated",
        description: `Application status has been changed to ${status}.`,
      });
      
      onStatusChange();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update application status",
      });
      setStatus(application.status); // Reset to original status
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadResume = () => {
    // In a real implementation, you would download the file from the server
    // For this example, we'll just show a toast notification
    toast({
      title: "Resume Download",
      description: "Resume download would be initiated here.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Application Details</DialogTitle>
            <Badge variant={getStatusBadgeVariant(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Information */}
          {job && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                Applied Position
              </h3>
              <div className="ml-7">
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-gray-500">{job.department} • {job.location}</p>
              </div>
            </div>
          )}

          {/* Applicant Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Full Name</p>
                  <p className="text-gray-700">{application.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-700">{application.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-700">{application.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Applied On</p>
                  <p className="text-gray-700">{formatDate(application.appliedAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Resume */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resume/CV</h3>
              <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="bg-gray-100 border rounded-md p-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-500 mr-3" />
              <div>
                <p className="font-medium">Resume File</p>
                <p className="text-sm text-gray-500">Click the download button to view the resume</p>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="space-y-4">
            {application.coverLetter && (
              <div>
                <h3 className="text-lg font-medium mb-2">Cover Letter</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                  {application.coverLetter}
                </div>
              </div>
            )}
            
            {application.experience && (
              <div>
                <h3 className="text-lg font-medium mb-2">Experience</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                  {application.experience}
                </div>
              </div>
            )}
            
            {application.education && (
              <div>
                <h3 className="text-lg font-medium mb-2">Education</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                  {application.education}
                </div>
              </div>
            )}
          </div>
          
          {/* Status Management */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-gray-500" />
              Application Status
            </h3>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-grow">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleStatusChange} 
                disabled={status === application.status || updating}
                className="whitespace-nowrap"
              >
                {updating ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              onClick={() => {
                setStatus('shortlisted');
                handleStatusChange();
              }}
              disabled={updating || application.status === 'shortlisted'}
            >
              <Check className="h-4 w-4 mr-1" />
              Shortlist
            </Button>
            
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              onClick={() => {
                setStatus('rejected');
                handleStatusChange();
              }}
              disabled={updating || application.status === 'rejected'}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetails;
