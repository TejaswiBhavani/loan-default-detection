import React, { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  XCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { BatchJob, BatchResult, APIResponse } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';
import ErrorBoundary from '../components/common/ErrorBoundary';

interface BatchProcessingState {
  currentJob: BatchJob | null;
  results: BatchResult[];
  isUploading: boolean;
  isExporting: boolean;
  searchTerm: string;
  filters: {
    status: string;
    riskCategory: string;
    recommendation: string;
  };
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const BatchProcessing: React.FC = () => {
  return (
    <ErrorBoundary>
      <BatchProcessingContent />
    </ErrorBoundary>
  );
};

const BatchProcessingContent: React.FC = () => {
  const [state, setState] = useState<BatchProcessingState>({
    currentJob: null,
    results: [],
    isUploading: false,
    isExporting: false,
    searchTerm: '',
    filters: {
      status: 'all',
      riskCategory: 'all',
      recommendation: 'all'
    },
    currentPage: 1,
    pageSize: 50,
    totalPages: 1
  });

  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<{show: boolean; type: 'success' | 'error' | 'warning'; message: string}>({
    show: false,
    type: 'success',
    message: ''
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      'age', 'income', 'employment_type', 'credit_score', 'debt_to_income',
      'loan_amount', 'loan_purpose', 'collateral_value'
    ];
    const csvContent = headers.join(',') + '\n' +
      '30,50000,employed,700,0.3,20000,home,25000\n' +
      '45,75000,self_employed,650,0.4,30000,business,35000';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Export results handler
  const exportResults = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!state.currentJob) {
      showToast('error', 'No batch job selected to export');
      return;
    }

    if (state.isExporting) {
      return; // Prevent double-clicks
    }

    setState(prev => ({ ...prev, isExporting: true }));

    try {
      showToast('success', `Preparing ${format.toUpperCase()} export...`);
      
      // For non-CSV formats, show a message since only CSV is implemented
      if (format !== 'csv') {
        showToast('warning', `${format.toUpperCase()} export not yet implemented. Downloading CSV instead.`);
      }
      
      const blob = await apiService.exportBatchResults(state.currentJob.id, 'csv');

      // Create download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = format === 'csv' ? 'csv' : 'csv'; // Always CSV for now
      a.href = url;
      a.download = `batch_${state.currentJob.filename || state.currentJob.id}_results.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('success', `${format.toUpperCase()} export completed successfully!`);
    } catch (error: any) {
      console.error('Export error:', error);
      showToast('error', error?.message || 'Export failed');
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return 'Please upload a CSV file';
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    console.log('📁 Starting file upload:', file.name, 'Size:', file.size);
    
    const validationError = validateFile(file);
    if (validationError) {
      console.error('❌ File validation failed:', validationError);
      showToast('error', validationError);
      return;
    }

    setState(prev => ({ ...prev, isUploading: true }));

    try {
      console.log('📤 Calling apiService.uploadBatchFile...');
      const response: APIResponse<BatchJob> = await apiService.uploadBatchFile(file);
      console.log('📨 API Response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Upload successful, job ID:', response.data.id);
        setState(prev => ({ 
          ...prev, 
          currentJob: response.data!, 
          isUploading: false,
          results: []
        }));
        showToast('success', 'File uploaded successfully. Processing started...');
        
        // Start polling for job status
        startJobPolling(response.data!.id);
      } else {
        console.error('❌ API returned error:', response.message);
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setState(prev => ({ ...prev, isUploading: false }));
      showToast('error', error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const startJobPolling = (jobId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await apiService.getBatchJobStatus(jobId);
        if (response.success && response.data) {
          setState(prev => ({ ...prev, currentJob: response.data! }));
          
          if (response.data!.status === 'completed' || response.data!.status === 'failed') {
            clearInterval(interval);
            setPollingInterval(null);
            
            if (response.data!.status === 'completed') {
              loadJobResults(jobId);
              showToast('success', 'Batch processing completed successfully!');
            } else {
              showToast('error', 'Batch processing failed. Please check the errors.');
            }
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const loadJobResults = async (jobId: string, page: number = 1) => {
    try {
      const response = await apiService.getBatchJobResults(jobId, page, state.pageSize);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          results: response.data!.data,
          currentPage: response.data!.page,
          totalPages: response.data!.total_pages
        }));
      }
    } catch (error) {
      showToast('error', 'Failed to load results');
    }
  };
  

  const filteredResults = state.results.filter(result => {
    const matchesSearch = !state.searchTerm || 
      JSON.stringify(result.applicant_data).toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesStatus = state.filters.status === 'all' || result.status === state.filters.status;
    
    const matchesRisk = state.filters.riskCategory === 'all' || 
      (result.prediction && result.prediction.risk_category === state.filters.riskCategory);
    
    const matchesRecommendation = state.filters.recommendation === 'all' || 
      (result.prediction && result.prediction.recommendation === state.filters.recommendation);

    return matchesSearch && matchesStatus && matchesRisk && matchesRecommendation;
  });



  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve': return 'text-green-600 bg-green-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'reject': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Processing</h1>
          <p className="text-gray-600">Upload multiple loan applications for batch risk assessment</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Download Template
          </button>
        </div>
      </div>

      {/* Upload Area */}
      {!state.currentJob && (
        <div className="bg-white shadow rounded-lg p-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {state.isUploading ? (
              <div className="space-y-4">
                <LoadingSpinner />
                <p className="text-gray-600">Uploading file...</p>
              </div>
            ) : (
              <>
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Upload CSV File</h3>
                  <p className="text-gray-600 mt-1">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                </div>
                <div className="mt-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Select File
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV files only. Maximum file size: 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Job Progress */}
      {state.currentJob && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
              <p className="text-sm text-gray-600">File: {state.currentJob.filename}</p>
            </div>
            <div className="flex items-center space-x-2">
              {state.currentJob.status === 'processing' && (
                <LoadingSpinner size="sm" />
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                state.currentJob.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : state.currentJob.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {state.currentJob.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{(state.currentJob.progress_percentage || 0).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.currentJob.progress_percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Records</span>
              <p className="font-semibold">{state.currentJob.total_records}</p>
            </div>
            <div>
              <span className="text-gray-500">Processed</span>
              <p className="font-semibold">{state.currentJob.processed_records}</p>
            </div>
            <div>
              <span className="text-gray-500">Successful</span>
              <p className="font-semibold text-green-600">{state.currentJob.successful_predictions}</p>
            </div>
            <div>
              <span className="text-gray-500">Failed</span>
              <p className="font-semibold text-red-600">{state.currentJob.failed_predictions}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {state.currentJob.status === 'completed' && (
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => exportResults('csv')}
                disabled={state.isExporting}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                  state.isExporting 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {state.isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={() => exportResults('xlsx')}
                disabled={state.isExporting}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                  state.isExporting 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {state.isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                onClick={() => exportResults('pdf')}
                disabled={state.isExporting}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                  state.isExporting 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {state.isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {state.results.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={state.filters.status}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, status: e.target.value }
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>

                <select
                  value={state.filters.riskCategory}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, riskCategory: e.target.value }
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                <select
                  value={state.filters.recommendation}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, recommendation: e.target.value }
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Recommendations</option>
                  <option value="approve">Approve</option>
                  <option value="review">Review</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recommendation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.row_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">Age: {result.applicant_data.personalInfo.age}</div>
                        <div className="text-gray-500">Income: ${result.applicant_data.personalInfo.income.toLocaleString()}</div>
                        <div className="text-gray-500">Loan: ${result.applicant_data.financialInfo.loan_amount.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.prediction && result.prediction.risk_score != null ? (
                        <div className="font-mono">
                          {(result.prediction.risk_score * 100).toFixed(1)}%
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.prediction ? (
                        <RiskBadge risk={result.prediction.risk_category} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.prediction ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getRecommendationColor(result.prediction.recommendation)
                        }`}>
                          {result.prediction.recommendation}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {state.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {state.currentPage} of {state.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    disabled={state.currentPage === 1}
                    onClick={() => {
                      if (state.currentJob && state.currentPage > 1) {
                        loadJobResults(state.currentJob.id, state.currentPage - 1);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={state.currentPage === state.totalPages}
                    onClick={() => {
                      if (state.currentJob && state.currentPage < state.totalPages) {
                        loadJobResults(state.currentJob.id, state.currentPage + 1);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!state.currentJob && !state.isUploading && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <DocumentArrowDownIcon className="mx-auto h-12 w-12 mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batch job in progress</h3>
          <p className="text-gray-600">
            Upload a CSV file to start batch processing loan applications.
          </p>
        </div>
      )}

      {/* Debug Info removed for production-like view */}
    </div>
  );
};

export default BatchProcessing;
