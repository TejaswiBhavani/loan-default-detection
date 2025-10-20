import React, { useState, useEffect } from 'react';
import {
  EnhancedDashboardMetrics,
  Alert,
  LoanApplication,
} from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface SmartDashboardProps {
  metrics: EnhancedDashboardMetrics;
  alerts: Alert[];
  recentApplications: LoanApplication[];
  loading?: boolean;
  onNewAssessment?: () => void;
  onBatchUpload?: () => void;
  onReviewQueue?: () => void;
  onCRMSync?: () => void;
  onPerformanceReport?: () => void;
  onApplicationClick?: (applicationId: string) => void;
  onAlertClick?: (alertId: string) => void;
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  metrics,
  alerts,
  recentApplications,
  loading = false,
  onNewAssessment,
  onBatchUpload,
  onReviewQueue,
  onCRMSync,
  onPerformanceReport,
  onApplicationClick,
  onAlertClick,
}) => {
  const [userName, setUserName] = useState<string>('Sarah Chen');

  useEffect(() => {
    // Get user name from context/auth
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskEmoji = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      case 'critical':
        return '⛔';
      default:
        return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">🏠 Loan Officer Dashboard</h1>
          <p className="text-slate-600 mt-2">Professional Lending Decision Center</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-sm">
          <span className="text-sm text-slate-600">Logged in as:</span>
          <span className="font-semibold text-slate-900">{userName}</span>
          <span className="text-2xl">👤</span>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-600">🟢 {metrics.active}</div>
          <p className="text-sm text-slate-600 mt-2">Active Applications</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-600">🟡 {metrics.pendingReview}</div>
          <p className="text-sm text-slate-600 mt-2">Pending Review</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-600">🔴 {metrics.urgent}</div>
          <p className="text-sm text-slate-600 mt-2">Urgent</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-600">📊 {metrics.todayProcessed}</div>
          <p className="text-sm text-slate-600 mt-2">Today</p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.todayProcessed} of {metrics.todayTotal}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">⏱️</div>
          <p className="text-sm text-slate-600 mt-2">Processing Time</p>
          <p className="text-xs text-slate-500 mt-1">{metrics.avgProcessingTime} min avg</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onNewAssessment}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + New Assessment
          </button>
          <button
            onClick={onBatchUpload}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            📁 Batch Upload
          </button>
          <button
            onClick={onReviewQueue}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
          >
            📋 Review Queue
          </button>
          <button
            onClick={onCRMSync}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
          >
            🔄 CRM Sync
          </button>
          <button
            onClick={onPerformanceReport}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition font-medium"
          >
            📈 Performance Report
          </button>
        </div>
      </div>

      {/* Urgent Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          🚨 Urgent Alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-slate-600">✅ No urgent alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert.id)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-l-4 border-yellow-500 hover:bg-yellow-100'
                    : 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100'
                }`}
              >
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="text-sm text-slate-700 mt-1">{alert.message}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📈 My Performance (30 Days)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Decision Accuracy</span>
              <span className="font-bold text-lg text-green-600">
                {formatPercentage(metrics.myApprovalRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">AI Agreement Rate</span>
              <span className="font-bold text-lg text-blue-600">
                {formatPercentage(metrics.aiAgreementRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Override Rate</span>
              <span className="font-bold text-lg text-yellow-600">
                {formatPercentage(metrics.overrideRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Override Success</span>
              <span className="font-bold text-lg text-purple-600">
                {formatPercentage(metrics.overrideSuccessRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Avg Processing Time</span>
              <span className="font-bold text-lg text-slate-900">
                {metrics.avgProcessingTime} min
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🤝 Team Comparison</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Your Default Rate</span>
              <span className="font-bold text-lg text-green-600">
                {formatPercentage(metrics.myDefaultRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Team Avg Default</span>
              <span className="font-bold text-lg text-slate-600">
                {formatPercentage(metrics.teamDefaultRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">You approve</span>
              <span className="font-bold text-lg text-green-600">
                {metrics.myApprovalRate > 50 ? '+' : ''}{(metrics.myApprovalRate - 50).toFixed(1)}%
              </span>
              <span className="text-sm text-slate-600">vs peers</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Processing Time vs Team</span>
              <span className="font-bold text-lg text-green-600">
                {metrics.avgProcessingTime < metrics.teamAvgProcessingTime ? '✅ Faster' : '⚠️ Slower'}
              </span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
              <p className="text-sm text-blue-900">
                ✨ <strong>Strongest area:</strong> Small business loans (98% accuracy)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Applicant</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Risk</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">AI Recommendation</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.slice(0, 10).map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{app.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {formatCurrency(app.loanDetails.loanAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(
                        app.aiAnalysis.riskCategory
                      )}`}
                    >
                      {getRiskEmoji(app.aiAnalysis.riskCategory)} {app.aiAnalysis.riskScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-sm font-medium ${
                        app.workflow.status === 'approved'
                          ? 'text-green-600'
                          : app.workflow.status === 'denied'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {app.workflow.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium">
                      {app.aiAnalysis.recommendation}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onApplicationClick?.(app.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SmartDashboard;
