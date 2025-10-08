import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initSentry, SentryErrorBoundary } from './utils/monitoring';
import { initAnalytics, initWebVitals } from './utils/analytics';

// Initialize monitoring and analytics
initSentry();
initAnalytics({
  gaId: process.env.REACT_APP_GA_MEASUREMENT_ID,
  hotjarId: process.env.REACT_APP_HOTJAR_ID,
});
initWebVitals();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={({ error }) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">Application Error</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Something went wrong. Please refresh the page or contact support if the problem persists.</p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-400">Error Details</summary>
                    <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">{String(error)}</pre>
                  </details>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )}>
      <App />
    </SentryErrorBoundary>
  </React.StrictMode>
);

// Enhanced web vitals reporting
reportWebVitals((metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
});
