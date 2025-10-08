import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PredictionResult, FilterOptions, APIResponse, PaginatedResponse } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import { formatDateTime, formatPercentage } from '../utils/formatters';

interface PredictionHistoryState {
  predictions: PredictionResult[];
  loading: boolean;
  filters: FilterOptions;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  selectedPrediction: PredictionResult | null;
  showDetailModal: boolean;
  showFilters: boolean;
}

const PredictionHistory: React.FC = () => {
  const [state, setState] = useState<PredictionHistoryState>({
    predictions: [],
    loading: true,
    filters: {},
    searchTerm: '',
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20,
    selectedPrediction: null,
    showDetailModal: false,
    showFilters: false
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

  // Load predictions data
  const loadPredictions = async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response: APIResponse<PaginatedResponse<PredictionResult>> = await apiService.getPredictions(
        state.filters,
        page,
        state.pageSize
      );
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          predictions: response.data!.data,
          currentPage: response.data!.page,
          totalPages: response.data!.total_pages,
          totalItems: response.data!.total,
          loading: false
        }));
      } else {
        throw new Error(response.message || 'Failed to load predictions');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('error', error instanceof Error ? error.message : 'Failed to load predictions');
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [state.filters, state.pageSize]);

  const handleSearch = React.useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  }, []);

  const handleFilterChange = React.useCallback((newFilters: Partial<FilterOptions>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      currentPage: 1
    }));
  }, []);

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {},
      searchTerm: '',
      currentPage: 1
    }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: page }));
      loadPredictions(page);
    }
  };

  const viewDetails = (prediction: PredictionResult) => {
    setState(prev => ({
      ...prev,
      selectedPrediction: prediction,
      showDetailModal: true
    }));
  };

  const closeDetailModal = () => {
    setState(prev => ({
      ...prev,
      selectedPrediction: null,
      showDetailModal: false
    }));
  };

  const exportData = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const blob = await apiService.exportData({
        format,
        filters: state.filters
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prediction_history_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('success', `History exported as ${format.toUpperCase()}`);
    } catch (error) {
      showToast('error', 'Failed to export data');
    }
  };

  // Filter predictions based on search term
  const filteredPredictions = state.predictions.filter(prediction => {
    if (!state.searchTerm) return true;
    const searchLower = state.searchTerm.toLowerCase();
    return (
      prediction.id.toLowerCase().includes(searchLower) ||
      prediction.applicant_id.toLowerCase().includes(searchLower) ||
      prediction.risk_category.toLowerCase().includes(searchLower) ||
      prediction.recommendation.toLowerCase().includes(searchLower)
    );
  });

  const getRiskScoreColor = (score: number) => {
    if (score <= 0.3) return 'text-green-600';
    if (score <= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'approve':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'review':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'reject':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
          <p className="text-gray-600">Review past decisions and analyze trends</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              state.showFilters 
                ? 'border-blue-300 text-blue-700 bg-blue-50' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            {/* Export dropdown would go here */}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, applicant, risk level, or recommendation..."
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              value={state.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {state.showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleFilterChange({
                      date_range: { 
                        ...state.filters.date_range, 
                        start: e.target.value 
                      }
                    })}
                  />
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleFilterChange({
                      date_range: { 
                        ...state.filters.date_range, 
                        end: e.target.value 
                      }
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onChange={(e) => handleFilterChange({
                    risk_categories: e.target.value ? [e.target.value as any] : undefined
                  })}
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onChange={(e) => handleFilterChange({
                    recommendations: e.target.value ? [e.target.value as any] : undefined
                  })}
                >
                  <option value="">All Recommendations</option>
                  <option value="approve">Approve</option>
                  <option value="review">Review</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleFilterChange({
                      min_loan_amount: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleFilterChange({
                      max_loan_amount: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Predictions ({state.totalItems} total)
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                value={state.pageSize}
                onChange={(e) => setState(prev => ({ ...prev, pageSize: Number(e.target.value) }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
        </div>

        {state.loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recommendation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPredictions.map((prediction) => (
                  <tr key={prediction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(prediction.created_at)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {prediction.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 font-mono">
                          {prediction.applicant_id.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-mono font-semibold ${getRiskScoreColor(prediction.risk_score)}`}>
                        {formatPercentage(prediction.risk_score)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskBadge risk={prediction.risk_category} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRecommendationIcon(prediction.recommendation)}
                        <span className="ml-2 text-sm font-medium capitalize">
                          {prediction.recommendation}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPercentage(prediction.confidence)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewDetails(prediction)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((state.currentPage - 1) * state.pageSize) + 1} to{' '}
                {Math.min(state.currentPage * state.pageSize, state.totalItems)} of{' '}
                {state.totalItems} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={state.currentPage === 1}
                  onClick={() => handlePageChange(state.currentPage - 1)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === state.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={state.currentPage === state.totalPages}
                  onClick={() => handlePageChange(state.currentPage + 1)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {state.showDetailModal && state.selectedPrediction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Prediction Details</h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Prediction ID:</dt>
                        <dd className="text-sm text-gray-900 font-mono">{state.selectedPrediction.id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Applicant ID:</dt>
                        <dd className="text-sm text-gray-900 font-mono">{state.selectedPrediction.applicant_id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Created:</dt>
                        <dd className="text-sm text-gray-900">{formatDateTime(state.selectedPrediction.created_at)}</dd>
                      </div>
                      {state.selectedPrediction.processed_by && (
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Processed By:</dt>
                          <dd className="text-sm text-gray-900">{state.selectedPrediction.processed_by}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Risk Assessment */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Assessment</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Risk Score:</span>
                        <span className={`text-2xl font-bold ${getRiskScoreColor(state.selectedPrediction.risk_score)}`}>
                          {formatPercentage(state.selectedPrediction.risk_score)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Risk Level:</span>
                        <RiskBadge risk={state.selectedPrediction.risk_category} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Confidence:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPercentage(state.selectedPrediction.confidence)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Recommendation:</span>
                        <div className="flex items-center">
                          {getRecommendationIcon(state.selectedPrediction.recommendation)}
                          <span className="ml-2 text-sm font-medium capitalize">
                            {state.selectedPrediction.recommendation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Importance */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Feature Importance</h3>
                  <div className="space-y-2">
                    {state.selectedPrediction.feature_importance.slice(0, 10).map((feature, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {feature.display_name}
                            </span>
                            <span className={`text-xs font-medium ${
                              feature.impact === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(feature.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                feature.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${feature.importance * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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

export default PredictionHistory;
