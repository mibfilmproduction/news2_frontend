import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Language = 'hindi' | 'english';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  onChange?: (language: Language) => void;
  className?: string;
}

const languageLabels: Record<Language, string> = {
  hindi: 'हिंदी',
  english: 'English'
};

export const languageStorage = {
  getLanguage: (): Language => {
    const storedLang = localStorage.getItem('language');
    return (storedLang as Language) || 
      (import.meta.env.VITE_DEFAULT_LANGUAGE as Language) || 
      'hindi';
  },
  
  setLanguage: (language: Language) => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language === 'hindi' ? 'hi' : 'en');
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }
};

export const useLanguage = () => {
  const defaultLanguage = (import.meta.env.VITE_DEFAULT_LANGUAGE as Language) || 'hindi';
  const [language, setLanguage] = useLocalStorage<Language>('language', defaultLanguage);
  
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    document.documentElement.setAttribute('lang', newLanguage === 'hindi' ? 'hi' : 'en');
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: newLanguage } }));
  };
  
  return { language, changeLanguage };
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'default',
  onChange,
  className = ''
}) => {
  const { language, changeLanguage } = useLanguage();
  
  const handleChangeLanguage = (newLanguage: Language) => {
    changeLanguage(newLanguage);
    if (onChange) onChange(newLanguage);
  };
  
  // Compact variant just shows language name
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => handleChangeLanguage(language === 'hindi' ? 'english' : 'hindi')}
      >
        {languageLabels[language]}
      </Button>
    );
  }
  
  // Default variant shows dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-1 ${className}`}
        >
          <Globe className="h-4 w-4" />
          {languageLabels[language]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleChangeLanguage('hindi')}>
          {languageLabels.hindi}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChangeLanguage('english')}>
          {languageLabels.english}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
