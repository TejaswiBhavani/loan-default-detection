import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { PredictionResult, AnalyticsState, ModelMetrics, DashboardMetrics, TrendData, RiskDistributionData } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { formatPercentage, formatDateTime } from '../utils/formatters';



const Analytics: React.FC = () => {
  const [state, setState] = useState<AnalyticsState>({
    modelMetrics: null,
    dashboardMetrics: null,
    trendData: [],
    riskDistribution: [],
    loading: true,
    selectedTimeRange: 'month',
    error: null,
    lastUpdated: null
  });

  const [toast, setToast] = useState<{show: boolean; type: 'success' | 'error' | 'warning'; message: string}>({
    show: false,
    type: 'success',
    message: ''
  });

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Load analytics data
  const loadAnalyticsData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // For demo purposes, we'll use mock data
      // In production, uncomment the API calls below:
      // const [modelResponse, dashboardResponse] = await Promise.all([
      //   apiService.getModelMetrics(),
      //   apiService.getDashboardMetrics()
      // ]);

      // Mock model metrics
      const mockModelMetrics: ModelMetrics = {
        accuracy: 0.947,
        precision: 0.923,
        recall: 0.891,
        f1_score: 0.906,
        auc_roc: 0.978,
        confusion_matrix: [
          [156, 12, 3],
          [8, 67, 7],
          [2, 5, 27]
        ],
        feature_importance_global: [
          { feature: 'credit_score', importance: 0.235, impact: 'negative', display_name: 'Credit Score' },
          { feature: 'debt_to_income_ratio', importance: 0.189, impact: 'positive', display_name: 'Debt-to-Income Ratio' },
          { feature: 'income', importance: 0.156, impact: 'negative', display_name: 'Annual Income' },
          { feature: 'loan_amount', importance: 0.134, impact: 'positive', display_name: 'Loan Amount' },
          { feature: 'employment_length', importance: 0.089, impact: 'negative', display_name: 'Employment Length' },
          { feature: 'age', importance: 0.067, impact: 'negative', display_name: 'Age' },
          { feature: 'existing_debts', importance: 0.054, impact: 'positive', display_name: 'Existing Debts' },
          { feature: 'credit_history_length', importance: 0.043, impact: 'negative', display_name: 'Credit History Length' },
          { feature: 'payment_history_score', importance: 0.033, impact: 'negative', display_name: 'Payment History' }
        ],
        model_version: 'v2.1.3',
        last_updated: new Date().toISOString()
      };

      const mockDashboardMetrics: DashboardMetrics = {
        total_predictions_today: 247,
        approval_rate_today: 0.682,
        approval_rate_week: 0.695,
        average_risk_score: 0.386,
        high_risk_applications: 23,
        pending_reviews: 15,
        system_accuracy: 0.947,
        recent_predictions: []
      };

      // if (modelResponse.success && dashboardResponse.success) {
        // Generate mock trend data
        const mockTrendData: TrendData[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          approvals: Math.floor(Math.random() * 50) + 30,
          rejections: Math.floor(Math.random() * 20) + 10,
          reviews: Math.floor(Math.random() * 15) + 5,
          average_risk: Math.random() * 0.3 + 0.35
        }));

        // Generate mock risk distribution
        const mockRiskDistribution: RiskDistributionData[] = [
          { category: 'Low Risk', count: 156, percentage: 62.4 },
          { category: 'Medium Risk', count: 67, percentage: 26.8 },
          { category: 'High Risk', count: 27, percentage: 10.8 }
        ];

        setState(prev => ({
          ...prev,
          modelMetrics: mockModelMetrics,
          dashboardMetrics: mockDashboardMetrics,
          trendData: mockTrendData,
          riskDistribution: mockRiskDistribution,
          loading: false
        }));
      // } else {
      //   throw new Error('Failed to load analytics data');
      // }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('error', error instanceof Error ? error.message : 'Failed to load analytics data');
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [state.selectedTimeRange]);

  // Chart colors
  const COLORS = {
    low: '#10B981',
    medium: '#F59E0B', 
    high: '#EF4444',
    primary: '#3B82F6',
    secondary: '#8B5CF6'
  };

  // Confusion Matrix Component
  const ConfusionMatrix: React.FC<{ matrix: number[][] }> = ({ matrix }) => {
    const labels = ['Low Risk', 'Medium Risk', 'High Risk'];
    const total = matrix.flat().reduce((sum, val) => sum + val, 0);

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Confusion Matrix</h3>
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div></div>
          {labels.map((label, i) => (
            <div key={i} className="text-center font-medium text-gray-600 p-2">
              {label}
            </div>
          ))}
          {matrix.map((row, i) => (
            <React.Fragment key={i}>
              <div className="text-right font-medium text-gray-600 p-2">
                {labels[i]}
              </div>
              {row.map((value, j) => (
                <div
                  key={j}
                  className={`text-center p-2 rounded ${
                    i === j 
                      ? 'bg-green-100 text-green-800 font-semibold' 
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {value}
                  <div className="text-xs text-gray-500">
                    ({((value / total) * 100).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Feature Importance Chart
  const FeatureImportanceChart: React.FC<{ features: any[] }> = ({ features }) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Importance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={features.slice(0, 10)}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 1]} tickFormatter={formatPercentage} />
            <YAxis dataKey="display_name" type="category" width={120} />
            <Tooltip formatter={(value) => [formatPercentage(value as number), 'Importance']} />
            <Bar 
              dataKey="importance" 
              fill={COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Model performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={state.selectedTimeRange}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              selectedTimeRange: e.target.value as any 
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Model Performance Metrics */}
      {state.modelMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Accuracy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatPercentage(state.modelMetrics.accuracy)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Precision
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatPercentage(state.modelMetrics.precision)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recall
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatPercentage(state.modelMetrics.recall)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    F1 Score
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {formatPercentage(state.modelMetrics.f1_score)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={state.riskDistribution as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {state.riskDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? COLORS.low : index === 1 ? COLORS.medium : COLORS.high} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Predictions Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={state.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="approvals"
                stackId="1"
                stroke={COLORS.low}
                fill={COLORS.low}
                name="Approvals"
              />
              <Area
                type="monotone"
                dataKey="reviews"
                stackId="1"
                stroke={COLORS.medium}
                fill={COLORS.medium}
                name="Reviews"
              />
              <Area
                type="monotone"
                dataKey="rejections"
                stackId="1"
                stroke={COLORS.high}
                fill={COLORS.high}
                name="Rejections"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        {state.modelMetrics && (
          <FeatureImportanceChart features={state.modelMetrics.feature_importance_global} />
        )}

        {/* Average Risk Score Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Average Risk Score Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={state.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                domain={[0, 1]}
                tickFormatter={formatPercentage}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [formatPercentage(value as number), 'Average Risk Score']}
              />
              <Line 
                type="monotone" 
                dataKey="average_risk" 
                stroke={COLORS.primary} 
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix */}
      {state.modelMetrics && (
        <ConfusionMatrix matrix={state.modelMetrics.confusion_matrix} />
      )}

      {/* Model Information */}
      {state.modelMetrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Model Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Model Version:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{state.modelMetrics.model_version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Last Updated:</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(state.modelMetrics.last_updated)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">AUC-ROC Score:</dt>
                  <dd className="text-sm text-gray-900 font-semibold">{formatPercentage(state.modelMetrics.auc_roc)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Key Performance Indicators</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Model Accuracy</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${state.modelMetrics.accuracy * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(state.modelMetrics.accuracy)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Precision</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${state.modelMetrics.precision * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(state.modelMetrics.precision)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Recall</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${state.modelMetrics.recall * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(state.modelMetrics.recall)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
