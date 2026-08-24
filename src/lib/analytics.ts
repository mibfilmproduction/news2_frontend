// Simple analytics module for tracking user behavior
// This can be replaced with Google Analytics, Plausible, or any other analytics service

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

interface PageView {
  path: string;
  title?: string;
  referrer?: string;
}

class Analytics {
  private isInitialized = false;
  private debug = false;
  private disabled = false;

  constructor() {
    // Disable analytics if Do Not Track is enabled
    if (typeof window !== 'undefined' && window.navigator.doNotTrack === '1') {
      this.disabled = true;
    }
  }

  // Initialize analytics - this should be called once when the app loads
  init(analyticsId?: string, options: { debug?: boolean } = {}) {
    if (this.isInitialized || this.disabled) return;

    this.debug = options.debug || false;

    // Only load analytics in production
    if (import.meta.env.PROD && analyticsId) {
      try {
        // Load Google Analytics script - this is just an example
        // In production, you would use a proper analytics package
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', analyticsId, {
          send_page_view: false, // We'll handle page views manually
        });

        this.isInitialized = true;

        if (this.debug) {
          console.log('Analytics initialized');
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    }
  }

  // Track a page view
  pageView({ path, title, referrer }: PageView) {
    if (this.disabled) return;

    if (this.debug) {
      console.log('Analytics page view:', { path, title, referrer });
    }

    if (this.isInitialized && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.origin + path,
        page_path: path,
        referrer: referrer,
      });
    }
  }

  // Track an event
  event({ category, action, label, value, nonInteraction = false }: AnalyticsEvent) {
    if (this.disabled) return;

    if (this.debug) {
      console.log('Analytics event:', { category, action, label, value, nonInteraction });
    }

    if (this.isInitialized && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        non_interaction: nonInteraction,
      });
    }
  }

  // Track user timing
  timing(category: string, variable: string, duration: number, label?: string) {
    if (this.disabled) return;

    if (this.debug) {
      console.log('Analytics timing:', { category, variable, duration, label });
    }

    if (this.isInitialized && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: duration,
        event_category: category,
        event_label: label,
      });
    }
  }

  // Set user properties
  setUser(userId: string, properties?: Record<string, any>) {
    if (this.disabled) return;

    if (this.debug) {
      console.log('Analytics set user:', { userId, properties });
    }

    if (this.isInitialized && window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...properties,
      });
    }
  }
}

// Extend Window interface to include gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Create and export a singleton instance
const analytics = new Analytics();
export default analytics;
