import React from 'react';
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorDisplayProps {
  message: string;
  className?: string;
  retry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, className, retry }) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center rounded-md bg-destructive/10", 
      className
    )}>
      <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
      <h3 className="font-medium text-destructive">Error</h3>
      <p className="text-muted-foreground mt-1">{message}</p>
      
      {retry && (
        <button 
          onClick={retry}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
