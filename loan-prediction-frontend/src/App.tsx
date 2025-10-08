import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SingleAssessment = React.lazy(() => import('./pages/SingleAssessment'));
const BatchProcessing = React.lazy(() => import('./pages/BatchProcessing'));
const PredictionHistory = React.lazy(() => import('./pages/PredictionHistory'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          }>
            <Routes>
              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Main application routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assess/single" element={<SingleAssessment />} />
              <Route path="/assess/batch" element={<BatchProcessing />} />
              <Route path="/history" element={<PredictionHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Fallback for unknown routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
