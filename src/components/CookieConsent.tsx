
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 border-t border-gray-200">
      <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-sm">
          This website uses cookies or similar technologies to enhance your browsing experience and provide personalized recommendations. By continuing to use our website, you agree to our{' '}
          <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> and{' '}
          <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
        </div>
        <div className="flex-shrink-0">
          <Button 
            variant="default" 
            onClick={() => setIsVisible(false)} 
            className="bg-gray-900 hover:bg-gray-800 px-6"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
