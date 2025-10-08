import * as Sentry from '@sentry/react';

// Initialize Sentry for error tracking
export const initSentry = () => {
  if (process.env.REACT_APP_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      // Performance monitoring
      tracesSampleRate: 1.0,
      // Release tracking
      release: process.env.REACT_APP_VERSION || '1.0.0',
      // User context
      beforeSend(event) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ChunkLoadError') {
            // Handle chunk load errors gracefully
            return null;
          }
        }
        return event;
      },
    });
  }
};

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
};

// Custom error logging
export const logError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
};

// User identification
export const identifyUser = (user: { id: string; email?: string; role?: string }) => {
  Sentry.setUser(user);
};

// Custom breadcrumb
export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};