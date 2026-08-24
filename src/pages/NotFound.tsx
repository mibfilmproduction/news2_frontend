
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist or has been moved." url="/404" noIndex />
      <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
      <p className="text-2xl font-semibold mb-6">Page Not Found</p>
      <p className="text-gray-600 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/">Go to Homepage</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
