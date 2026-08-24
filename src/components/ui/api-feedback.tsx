import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApiLoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ApiLoading({ 
  message = 'Loading data...', 
  className,
  size = 'md'
}: ApiLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center", 
      className
    )}>
      <Loader2 className={cn("animate-spin text-primary mb-2", sizeClasses[size])} />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

interface ApiErrorProps {
  message?: string;
  className?: string;
  onRetry?: () => void;
}

export function ApiError({
  message = 'There was an error loading the data.',
  className,
  onRetry
}: ApiErrorProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center", 
      className
    )}>
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-gray-700 mb-3">{message}</p>
      {onRetry && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRetry} 
          className="flex gap-2 items-center"
        >
          <RefreshCw className="h-3 w-3" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ApiEmptyStateProps {
  message?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function ApiEmptyState({
  message = 'No data available.',
  className,
  icon,
  action
}: ApiEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center", 
      className
    )}>
      {icon || <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-gray-400 text-lg">?</span>
      </div>}
      <p className="text-gray-500 mb-3">{message}</p>
      {action}
    </div>
  );
}
