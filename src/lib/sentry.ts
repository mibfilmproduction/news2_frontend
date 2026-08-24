import * as Sentry from '@sentry/react';
// Import specific integrations if needed
// Note: These imports might need to be adjusted based on your Sentry package version
type Integration = any; // Use proper type if available in your Sentry version

// Initialize Sentry
// Only initialize in production mode to avoid unnecessary error reporting during development
export const initSentry = () => {
  // Only initialize in production and when Sentry DSN is available
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN || '',
        integrations: [],
        
        // Performance settings
        tracesSampleRate: 0.2,
        
        // Replay sampling rates if supported
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // Environment information
        environment: import.meta.env.MODE,
        enabled: import.meta.env.PROD,
        
        // Release version
        release: import.meta.env.VITE_APP_VERSION || 'development',
      });
      
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  } else {
    console.log('Sentry initialization skipped in development mode');
  }
};

// Utility function to log errors to Sentry
export const logError = (error: Error, extras?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.captureException(error, {
        extra: extras,
      });
    } catch (sentryError) {
      console.error('Failed to log error to Sentry:', sentryError);
      console.error('Original error:', error, 'Extras:', extras);
    }
  } else {
    console.error('Error:', error, 'Extras:', extras);
  }
};

// Utility function to log messages to Sentry
export const logMessage = (message: string, level: Sentry.SeverityLevel = 'info', extras?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.captureMessage(message, {
        level,
        extra: extras,
      });
    } catch (error) {
      console.error('Failed to log message to Sentry:', error);
      console.log(`[${level.toUpperCase()}] ${message}`, 'Extras:', extras);
    }
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, 'Extras:', extras);
  }
};

// Set user information for better error tracking
export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } catch (error) {
      console.error('Error setting Sentry user context:', error);
    }
  }
};

// Clear user context on logout
export const clearUserContext = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Error clearing Sentry user context:', error);
    }
  }
};

// Add custom tags to better categorize errors
export const setTag = (key: string, value: string) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.error('Error setting Sentry tag:', error);
    }
  }
};
