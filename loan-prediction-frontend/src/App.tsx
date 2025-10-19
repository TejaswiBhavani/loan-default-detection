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
                path="/assess/single"
                element={
                  <PrivateRoute requiredRoles={['admin', 'loan_officer', 'underwriter', 'analyst']}>
                    <Layout>
                      <SingleAssessment />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/assess/batch"
                element={
                  <PrivateRoute requiredRoles={['admin', 'loan_officer', 'underwriter', 'analyst']}>
                    <Layout>
                      <BatchProcessing />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/history"
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
                  <PrivateRoute requiredRoles={['admin', 'analyst']}>
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
              
              {/* Fallback for unknown routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
