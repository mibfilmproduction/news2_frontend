
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import SEO from "@/components/SEO";
import { Loader2, Mail, Phone, MapPin, Clock } from "lucide-react";

// Form validation types
interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  form?: string;
}

// Rate limiting state
interface RateLimitState {
  attempts: number;
  lastAttempt: number | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: null
  });
  const isRateLimited = rateLimit.attempts >= MAX_ATTEMPTS && 
                       rateLimit.lastAttempt && 
                       (Date.now() - rateLimit.lastAttempt) < RATE_LIMIT_WINDOW;
  const timeLeft = rateLimit.lastAttempt 
    ? Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - rateLimit.lastAttempt)) / 60000) 
    : 0;

  // Load rate limit state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('contactFormRateLimit');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only use saved state if it's from the current day
        if (parsed.lastAttempt && Date.now() - parsed.lastAttempt < RATE_LIMIT_WINDOW) {
          setRateLimit(parsed);
        }
      } catch (e) {
        console.error('Failed to parse rate limit state', e);
      }
    }
  }, []);

  // Save rate limit state to localStorage whenever it changes
  useEffect(() => {
    if (rateLimit.attempts > 0 || rateLimit.lastAttempt) {
      localStorage.setItem('contactFormRateLimit', JSON.stringify(rateLimit));
    }
  }, [rateLimit]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error for the field being edited
    if (errors[id as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [id]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if rate limited
    const now = Date.now();
    if (rateLimit.attempts >= MAX_ATTEMPTS && 
        rateLimit.lastAttempt && 
        now - rateLimit.lastAttempt < RATE_LIMIT_WINDOW) {
      const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - rateLimit.lastAttempt)) / 60000);
      toast({
        title: "Too many attempts",
        description: `Please try again in ${timeLeft} minutes.`,
        variant: "destructive"
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setRateLimit(prev => ({
        attempts: prev.attempts + 1,
        lastAttempt: now
      }));
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await api.post('/contact', {
        ...formData,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        // Reset form and rate limit on success
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setErrors({});
        setSubmitSuccess(true);
        
        // Reset rate limit on successful submission
        setRateLimit({
          attempts: 0,
          lastAttempt: null
        });
        
        toast({
          title: "Message sent successfully!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
        
        // Reset success state after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setRateLimit(prev => ({
        attempts: prev.attempts + 1,
        lastAttempt: now
      }));
      
      setErrors(prev => ({
        ...prev,
        form: errorMessage
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Contact Us"
        description="Contact Mibnews - send us your news tips, feedback or questions. Our team is here to help you."
        url="/contact"
        keywords={['contact mibnews', 'contact news', 'news tips', 'feedback', 'mibnews']}
      />
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
          <p className="mb-4 text-gray-600">
            Have a question, feedback, or need assistance? Fill out the form and our team will get back to you as soon as possible.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input 
                id="name" 
                placeholder="Your name" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Your email address" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
              <Input 
                id="subject" 
                placeholder="Subject of your message" 
                value={formData.subject}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
              <Textarea 
                id="message" 
                placeholder="Type your message here..." 
                className="h-32"
                value={formData.message}
                onChange={handleChange}
                required 
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={isSubmitting || isRateLimited}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending Message...
                </>
              ) : isRateLimited ? (
                <>
                  <Clock className="mr-2 h-5 w-5" />
                  Try again in {Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - rateLimit.lastAttempt)) / 60000)} min{Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - rateLimit.lastAttempt)) / 60000) > 1 ? 's' : ''}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Message
                </>
              )}
            </Button>
            
            {isRateLimited && (
              <p className="mt-2 text-sm text-red-600 text-center">
                You've reached the maximum number of attempts. Please wait before trying again.
              </p>
            )}
          </form>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Headquarters</h3>
                <p className="text-gray-600">
                  O-794, 7th Floor<br />
                  Gaur City Center<br />
                  Greater Noida West<br />
                  Uttar Pradesh, India - 201318
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email Us</h3>
                <p className="text-gray-600">
                  <a href="mailto:info@mibnews.in" className="hover:text-primary transition-colors">
                    info@mibnews.in
                  </a><br />
                  <a href="mailto:support@mibnews.in" className="hover:text-primary transition-colors">
                    support@mibnews.in
                  </a>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Call Us</h3>
                <p className="text-gray-600">
                  <a href="tel:+919999292210" className="hover:text-primary transition-colors">
                    +91 99992 92210
                  </a><br />
                  <a href="tel:+918076039999" className="hover:text-primary transition-colors">
                    +91 80760 39999
                  </a>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Office Hours</h3>
                <p className="text-gray-600">
                  Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                  Saturday: 10:00 AM - 4:00 PM IST<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
