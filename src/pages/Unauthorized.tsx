import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <SEO title="Access Denied" noIndex />
      <div className="w-full max-w-lg text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="text-lg text-gray-700 mb-8">
          You don't have permission to access this page. This area requires higher authorization level.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link to="/">Return to Homepage</Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link to="/login">Sign in with another account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
