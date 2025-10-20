# Frontend Integration Setup Guide

## Quick Start

### 1. Install Dependencies
All required dependencies are already in package.json:
- react 19.2.0
- react-dom 19.2.0
- react-router-dom 7.9.3
- tailwindcss 3.4.0
- date-fns 4.1.0
- recharts 3.2.1
- zustand 5.0.8
- axios 1.12.2

### 2. Folder Structure

```
src/
├── components/
│   ├── dashboard/
│   │   └── SmartDashboard.tsx          ✅ NEW
│   ├── workflow/
│   │   └── ApplicationWorkflow.tsx     ✅ NEW
│   ├── analysis/
│   │   └── AIAnalysisPanel.tsx         ✅ NEW
│   ├── batch/
│   │   └── BatchProcessor.tsx          ✅ NEW
│   ├── analytics/
│   │   └── DecisionAnalytics.tsx       ✅ NEW
│   ├── mobile/
│   │   └── MobileSwipeInterface.tsx    ✅ NEW
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ...existing
├── hooks/
│   └── useLoanDashboard.ts             ✅ NEW
├── pages/
│   ├── Dashboard.tsx                   (Update)
│   ├── SingleAssessment.tsx            (Create if needed)
│   ├── BatchProcessing.tsx             (Create if needed)
│   └── ...existing
├── services/
│   ├── api.ts                          (Update with new endpoints)
│   └── ...existing
├── types/
│   └── index.ts                        ✅ UPDATED
└── utils/
    └── formatting.ts                   ✅ UPDATED
```

### 3. Update Existing Files

#### Update `src/App.tsx` - Add new routes

```tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import PrivateRoute from './components/common/PrivateRoute';

// Lazy load pages for code splitting
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SingleAssessment = React.lazy(() => import('./pages/SingleAssessment'));
const BatchProcessing = React.lazy(() => import('./pages/BatchProcessing'));
const PredictionHistory = React.lazy(() => import('./pages/PredictionHistory'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const DecisionAnalyticsPage = React.lazy(() => import('./pages/DecisionAnalyticsPage')); // NEW
const MobileQuickDecision = React.lazy(() => import('./pages/MobileQuickDecision')); // NEW
const Settings = React.lazy(() => import('./pages/Settings'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes wrapped in Layout */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navigate to="/dashboard" replace />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/single-assessment"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SingleAssessment />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/single-assessment/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SingleAssessment />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/batch-processing"
                element={
                  <PrivateRoute>
                    <Layout>
                      <BatchProcessing />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/decision-analytics"
                element={
                  <PrivateRoute>
                    <Layout>
                      <DecisionAnalyticsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/quick-decision"
                element={
                  <PrivateRoute>
                    <MobileQuickDecision />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/prediction-history"
                element={
                  <PrivateRoute>
                    <Layout>
                      <PredictionHistory />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

#### Update `src/services/api.ts` - Add new API methods

```typescript
// Add these methods to your existing API service
export const loanOfficerAPI = {
  // Dashboard
  getDashboardMetrics: () => 
    api.get<EnhancedDashboardMetrics>('/api/metrics/enhanced'),
  
  getApplications: (filters?: any) =>
    api.get<PaginatedResponse<LoanApplication>>('/api/applications', { params: filters }),
  
  getApplicationById: (id: string) =>
    api.get<LoanApplication>(`/api/applications/${id}`),
  
  // Decisions
  submitDecision: (applicationId: string, decision: any) =>
    api.post(`/api/applications/${applicationId}/decision`, decision),
  
  saveDraft: (applicationId: string, draft: any) =>
    api.post(`/api/applications/${applicationId}/draft`, draft),
  
  // Alerts
  getAlerts: () =>
    api.get<Alert[]>('/api/alerts'),
  
  acknowledgeAlert: (alertId: string) =>
    api.post(`/api/alerts/${alertId}/acknowledge`),
  
  // Batch Processing
  uploadBatch: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<BatchProcessingJob>('/api/batch/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  processBatch: (jobId: string, filters: SmartFilterConfig) =>
    api.post(`/api/batch/${jobId}/process`, filters),
  
  exportBatchResults: (jobId: string, format: 'csv' | 'xlsx' | 'pdf') =>
    api.get(`/api/batch/${jobId}/export`, { params: { format } }),
  
  // Analytics
  getOfficerPerformance: (timeRange: '7days' | '30days' | '90days' = '30days') =>
    api.get<OfficerPerformance>('/api/analytics/performance', { params: { range: timeRange } }),
  
  getRiskPatterns: (timeRange: '7days' | '30days' | '90days' = '30days') =>
    api.get<RiskPattern[]>('/api/analytics/patterns', { params: { range: timeRange } }),
  
  getPredictionTrends: (timeRange: '7days' | '30days' | '90days' = '30days') =>
    api.get<PredictionTrend[]>('/api/analytics/trends', { params: { range: timeRange } }),
};

export default loanOfficerAPI;
```

### 4. Create New Pages

#### Create `src/pages/SingleAssessment.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ApplicationWorkflow } from '../components/workflow/ApplicationWorkflow';
import { AIAnalysisPanel } from '../components/analysis/AIAnalysisPanel';
import { useApplicationDecision } from '../hooks/useLoanDashboard';
import { LoanApplication } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SingleAssessment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const { notes, setNotes, submitDecision, saveDraft, loading: decisionLoading } = useApplicationDecision(id || '');

  useEffect(() => {
    const loadApplication = async () => {
      if (!id) return;
      try {
        const response = await apiService.loanOfficerAPI.getApplicationById(id);
        if (response.success && response.data) {
          setApplication(response.data);
        }
      } catch (err) {
        console.error('Failed to load application', err);
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!application) return <div>Application not found</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-1">
        <ApplicationWorkflow application={application} />
      </div>
      <div className="lg:col-span-2">
        <AIAnalysisPanel
          analysis={application.aiAnalysis}
          onApprove={() => submitDecision('APPROVED')}
          onDeny={() => submitDecision('DENIED')}
          onSaveDraft={saveDraft}
          decisionNotes={notes}
          onNotesChange={setNotes}
          isLoading={decisionLoading}
        />
      </div>
    </div>
  );
};

export default SingleAssessment;
```

#### Create `src/pages/BatchProcessing.tsx`

```tsx
import React from 'react';
import { BatchProcessor } from '../components/batch/BatchProcessor';
import { useBatchProcessing } from '../hooks/useLoanDashboard';
import apiService from '../services/api';

const BatchProcessing: React.FC = () => {
  const { uploadFile, processWithFilters } = useBatchProcessing();

  const handleUpload = async (file: File) => {
    const jobId = await uploadFile(file);
    // Handle successful upload
  };

  const handleProcessing = async (filters: any) => {
    // Implement processing logic
  };

  return (
    <BatchProcessor
      onUpload={handleUpload}
      onProcessing={handleProcessing}
    />
  );
};

export default BatchProcessing;
```

#### Create `src/pages/DecisionAnalyticsPage.tsx`

```tsx
import React, { useState } from 'react';
import { DecisionAnalytics } from '../components/analytics/DecisionAnalytics';
import { useAnalytics } from '../hooks/useLoanDashboard';

const DecisionAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');
  const { performance, riskPatterns, predictionTrends, loading } = useAnalytics();

  if (loading || !performance) return <div>Loading...</div>;

  return (
    <DecisionAnalytics
      performance={performance}
      riskPatterns={riskPatterns}
      predictionTrends={predictionTrends}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    />
  );
};

export default DecisionAnalyticsPage;
```

#### Create `src/pages/MobileQuickDecision.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { MobileSwipeInterface } from '../components/mobile/MobileSwipeInterface';
import { LoanApplication } from '../types';
import apiService from '../services/api';

const MobileQuickDecision: React.FC = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await apiService.loanOfficerAPI.getApplications({ 
          status: 'pending',
          limit: 50 
        });
        if (response.success && response.data) {
          setApplications(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <MobileSwipeInterface
      applications={applications}
      onApprove={async (appId) => {
        await apiService.loanOfficerAPI.submitDecision(appId, { decision: 'APPROVED' });
      }}
      onDeny={async (appId) => {
        await apiService.loanOfficerAPI.submitDecision(appId, { decision: 'DENIED' });
      }}
    />
  );
};

export default MobileQuickDecision;
```

### 5. Update Navigation

Update your Layout/Navigation component to include new links:

```tsx
// Add to navigation menu
<Link to="/dashboard" className="nav-link">
  🏠 Dashboard
</Link>
<Link to="/single-assessment" className="nav-link">
  📋 Single Assessment
</Link>
<Link to="/batch-processing" className="nav-link">
  📁 Batch Processing
</Link>
<Link to="/decision-analytics" className="nav-link">
  📊 Analytics
</Link>
<Link to="/quick-decision" className="nav-link">
  ⚡ Quick Decision (Mobile)
</Link>
```

## Backend API Requirements

The frontend expects these endpoints to be implemented in your backend:

```
# Dashboard & Applications
GET    /api/applications
POST   /api/applications
GET    /api/applications/:id
PUT    /api/applications/:id
POST   /api/applications/:id/decision
POST   /api/applications/:id/draft

# Metrics & Alerts
GET    /api/metrics/enhanced
GET    /api/alerts
POST   /api/alerts/:id/acknowledge

# Batch Processing
POST   /api/batch/upload
POST   /api/batch/:jobId/process
GET    /api/batch/:jobId/export

# Analytics
GET    /api/analytics/performance
GET    /api/analytics/patterns
GET    /api/analytics/trends

# CRM Integration
POST   /api/crm/sync
```

## Testing

### Run the development server:
```bash
npm start
```

### Build for production:
```bash
npm run build
```

### Test individual components:
```bash
npm test
```

## Performance Optimization

- All components use React.memo where appropriate
- Lazy loading of pages with React.lazy()
- Efficient re-renders with proper dependency arrays
- Debounced API calls
- CSS optimization with Tailwind

## Troubleshooting

### Missing modules
```bash
npm install date-fns recharts zustand
```

### TypeScript errors
```bash
npm run build
```

### Style issues
- Ensure Tailwind CSS is properly configured
- Check tailwind.config.js
- Run: `npm run build:prod`

## Next Steps

1. ✅ Components created
2. ✅ Types defined
3. ✅ Hooks implemented
4. ⏳ Backend API implementation
5. ⏳ Integration with existing backend
6. ⏳ User testing and feedback
7. ⏳ Performance optimization
8. ⏳ Deployment
