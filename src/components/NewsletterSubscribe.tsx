import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from './LanguageSwitcher';
import api from '@/services/api';

interface NewsletterSubscribeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const translations = {
  hindi: {
    title: 'हमारे न्यूज़लेटर की सदस्यता लें',
    description: 'हर हफ्ते सर्वश्रेष्ठ समाचार और अपडेट प्राप्त करें',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'आपका ईमेल पता दर्ज करें',
    subscribeButton: 'सदस्यता लें',
    thankYou: 'सदस्यता के लिए धन्यवाद!',
    error: 'कुछ गलत हो गया। कृपया बाद में पुनः प्रयास करें।'
  },
  english: {
    title: 'Subscribe to our Newsletter',
    description: 'Get the best news and updates every week',
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter your email',
    subscribeButton: 'Subscribe',
    thankYou: 'Thank you for subscribing!',
    error: 'Something went wrong. Please try again later.'
  }
};

const NewsletterSubscribe: React.FC<NewsletterSubscribeProps> = ({
  variant = 'default',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  
  const text = language === 'hindi' ? translations.hindi : translations.english;
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // API call to subscribe the user
      await api.post('/newsletter/subscribe', { email, language });
      
      setIsSubscribed(true);
      setEmail('');
    } catch (err) {
      setError(text.error);
      console.error('Newsletter subscription error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {isSubscribed ? (
          <div className="flex items-center text-green-600 space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{text.thankYou}</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex space-x-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={text.emailPlaceholder}
              className="flex-1"
              disabled={isLoading}
              aria-label={text.emailLabel}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : text.subscribeButton}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex items-center justify-center py-4 text-green-600 space-x-2">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-lg font-medium">{text.thankYou}</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{text.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={text.emailPlaceholder}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </form>
        )}
      </CardContent>
      {!isSubscribed && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSubscribe} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {text.subscribeButton}
              </>
            ) : (
              text.subscribeButton
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default NewsletterSubscribe;
