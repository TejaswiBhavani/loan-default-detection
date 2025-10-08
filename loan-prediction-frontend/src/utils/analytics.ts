import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// Analytics configuration
interface AnalyticsConfig {
  gaId?: string;
  hotjarId?: string;
  mixpanelToken?: string;
}

// Initialize analytics
export const initAnalytics = (config: AnalyticsConfig) => {
  // Google Analytics 4
  if (config.gaId && process.env.NODE_ENV === 'production') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaId}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    const gtag = (...args: any[]) => {
      (window as any).dataLayer.push(args);
    };
    gtag('js', new Date());
    gtag('config', config.gaId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    // Make gtag available globally
    (window as any).gtag = gtag;
  }

  // Hotjar
  if (config.hotjarId && process.env.NODE_ENV === 'production') {
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function() { (h.hj.q = h.hj.q || []).push(arguments) };
      h._hjSettings = { hjid: config.hotjarId, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script'); r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

// Track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', { action, category, label, value });
  }
};

// Business-specific tracking events
export const trackPrediction = (type: 'single' | 'batch', result: 'success' | 'error') => {
  trackEvent('prediction_made', 'predictions', `${type}_${result}`);
};

export const trackFileUpload = (fileType: string, fileSize: number) => {
  trackEvent('file_upload', 'batch_processing', fileType, fileSize);
};

export const trackExport = (exportType: string, recordCount: number) => {
  trackEvent('data_export', 'exports', exportType, recordCount);
};

export const trackFilterUsage = (filterType: string) => {
  trackEvent('filter_applied', 'filtering', filterType);
};

export const trackTimeSpent = (page: string, timeInSeconds: number) => {
  trackEvent('time_on_page', 'engagement', page, timeInSeconds);
};

// Web Vitals tracking
const sendToAnalytics = (metric: Metric) => {
  // Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
};

// Initialize web vitals tracking
export const initWebVitals = () => {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

// User identification
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
      user_id: userId,
      custom_map: traits,
    });
  }
};

// A/B Testing support
export const trackExperiment = (experimentId: string, variant: string) => {
  trackEvent('experiment_view', 'experiments', `${experimentId}_${variant}`);
};

// Error tracking for analytics
export const trackError = (error: string, context?: string) => {
  trackEvent('error_occurred', 'errors', error, context ? 1 : 0);
};

// Performance tracking
export const trackPerformance = (metric: string, value: number, category: string = 'performance') => {
  trackEvent('performance_metric', category, metric, value);
};

// Business metrics
export const trackBusinessMetric = (metric: string, value: number, category: string = 'business') => {
  trackEvent('business_metric', category, metric, value);
};