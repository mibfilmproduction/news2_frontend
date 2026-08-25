import React, { useEffect } from 'react';
import { useLanguage } from './LanguageSwitcher';

// Web Vitals tracking component for performance monitoring
export const WebVitalsTracker: React.FC<{ 
  onMetric?: (metric: { name: string; value: number; rating: string }) => void 
}> = ({ onMetric }) => {
  const { language } = useLanguage();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Track LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const metric = {
            name: 'LCP',
            value: Math.round(lastEntry.startTime),
            rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor',
          };
          console.log(`LCP: ${metric.value}ms (${metric.rating})`);
          onMetric?.(metric);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // Track FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          const metric = {
            name: 'FID',
            value: Math.round(fidEntry.processingStart - fidEntry.startTime),
            rating: fidEntry.processingStart - fidEntry.startTime <= 100 ? 'good' : fidEntry.processingStart - fidEntry.startTime <= 300 ? 'needs-improvement' : 'poor',
          };
          console.log(`FID: ${metric.value}ms (${metric.rating})`);
          onMetric?.(metric);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observation not supported');
    }

    // Track CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        const metric = {
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
        };
        console.log(`CLS: ${metric.value} (${metric.rating})`);
        onMetric?.(metric);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observation not supported');
    }

    // Track FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            const metric = {
              name: 'FCP',
              value: Math.round(entry.startTime),
              rating: entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor',
            };
            console.log(`FCP: ${metric.value}ms (${metric.rating})`);
            onMetric?.(metric);
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP observation not supported');
    }

    // Track TTFB (Time to First Byte)
    try {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        const metric = {
          name: 'TTFB',
          value: Math.round(ttfb),
          rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
        };
        console.log(`TTFB: ${metric.value}ms (${metric.rating})`);
        onMetric?.(metric);
      }
    } catch (e) {
      console.warn('TTFB measurement not supported');
    }

    // Cleanup
    return () => {
      // Observers are automatically cleaned up when component unmounts
    };
  }, [language, onMetric]);

  return null;
};

// Hook for tracking custom metrics
export const useWebVitals = () => {
  const trackMetric = (name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
    console.log(`Custom Metric [${name}]: ${value} (${rating})`);
    // Could send to analytics endpoint here
  };

  return { trackMetric };
};

export default WebVitalsTracker;