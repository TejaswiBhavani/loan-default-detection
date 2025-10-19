import axios, { AxiosInstance, AxiosResponse } from 'axios';
import authService from './authService';
import { 
  APIResponse, 
  PaginatedResponse, 
  PredictionResult, 
  BatchJob, 
  ModelMetrics, 
  DashboardMetrics,
  Applicant,
  FilterOptions,
  ExportOptions
} from '../types';

// API Configuration - updated to match backend port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(
      (config) => {
        const token = authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Don't redirect on 401 here - let authService handle token refresh
        // Only handle other errors
        return Promise.reject(error);
      }
    );
  }

  // Single prediction - Updated to match backend endpoint
  async predictSingle(applicantData: any): Promise<APIResponse<PredictionResult>> {
    try {
      const response: AxiosResponse<APIResponse<PredictionResult>> = await this.api.post(
        '/predictions',
        applicantData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Batch prediction upload - Disabled for now (can be implemented if backend supports)
  async uploadBatchFile(file: File): Promise<APIResponse<BatchJob>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response: AxiosResponse<APIResponse<BatchJob>> = await this.api.post(
        '/predictions/batch',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Extended timeout for file uploads
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get batch job status - Disabled for now
  async getBatchJobStatus(jobId: string): Promise<APIResponse<BatchJob>> {
    try {
      const response: AxiosResponse<APIResponse<BatchJob>> = await this.api.get(
        `/predictions/batch/${jobId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get batch job results
  async getBatchJobResults(
    jobId: string, 
    page: number = 1, 
    perPage: number = 50
  ): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response: AxiosResponse<APIResponse<PaginatedResponse<any>>> = await this.api.get(
        `/batch/${jobId}/results`,
        {
          params: { page, per_page: perPage }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get recent predictions
  async getPredictions(
    filters?: FilterOptions,
    page: number = 1,
    perPage: number = 20
  ): Promise<APIResponse<PaginatedResponse<PredictionResult>>> {
    try {
      const response: AxiosResponse<APIResponse<PaginatedResponse<PredictionResult>>> = 
        await this.api.get('/predictions/recent', {
          params: {
            ...filters,
            page,
            limit: perPage
          }
        });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single prediction by ID
  async getPrediction(predictionId: string): Promise<APIResponse<PredictionResult>> {
    try {
      const response: AxiosResponse<APIResponse<PredictionResult>> = await this.api.get(
        `/predictions/${predictionId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get predictions by application ID
  async getPredictionsByApplication(applicationId: string): Promise<APIResponse<PredictionResult[]>> {
    try {
      const response: AxiosResponse<APIResponse<PredictionResult[]>> = await this.api.get(
        `/predictions/application/${applicationId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get model metrics - Backend endpoint may differ
  async getModelMetrics(): Promise<APIResponse<ModelMetrics>> {
    try {
      const response: AxiosResponse<APIResponse<ModelMetrics>> = await this.api.get(
        '/dashboard/model-metrics'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(): Promise<APIResponse<DashboardMetrics>> {
    try {
      const response: AxiosResponse<APIResponse<DashboardMetrics>> = await this.api.get(
        '/dashboard/metrics'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get applicants with pagination and filters
  async getApplicants(
    page: number = 1,
    perPage: number = 20,
    filters?: any
  ): Promise<APIResponse<PaginatedResponse<Applicant>>> {
    try {
      const response: AxiosResponse<APIResponse<PaginatedResponse<Applicant>>> = 
        await this.api.get('/applicants', {
          params: {
            page,
            limit: perPage,
            ...filters
          }
        });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single applicant
  async getApplicant(applicantId: string): Promise<APIResponse<Applicant>> {
    try {
      const response: AxiosResponse<APIResponse<Applicant>> = await this.api.get(
        `/applicants/${applicantId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new applicant
  async createApplicant(applicantData: any): Promise<APIResponse<Applicant>> {
    try {
      const response: AxiosResponse<APIResponse<Applicant>> = await this.api.post(
        '/applicants',
        applicantData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update applicant
  async updateApplicant(applicantId: string, applicantData: any): Promise<APIResponse<Applicant>> {
    try {
      const response: AxiosResponse<APIResponse<Applicant>> = await this.api.put(
        `/applicants/${applicantId}`,
        applicantData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get loan applications
  async getLoanApplications(
    page: number = 1,
    perPage: number = 20,
    filters?: any
  ): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response: AxiosResponse<APIResponse<PaginatedResponse<any>>> = 
        await this.api.get('/loan-applications', {
          params: {
            page,
            limit: perPage,
            ...filters
          }
        });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single loan application
  async getLoanApplication(applicationId: string): Promise<APIResponse<any>> {
    try {
      const response: AxiosResponse<APIResponse<any>> = await this.api.get(
        `/loan-applications/${applicationId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create loan application
  async createLoanApplication(applicationData: any): Promise<APIResponse<any>> {
    try {
      const response: AxiosResponse<APIResponse<any>> = await this.api.post(
        '/loan-applications',
        applicationData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export data
  async exportData(options: ExportOptions): Promise<Blob> {
    try {
      const response = await this.api.post('/export', options, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download batch template
  async downloadBatchTemplate(): Promise<Blob> {
    try {
      const response = await this.api.get('/batch/template', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // System health check - Updated to match backend
  async checkSystemHealth(): Promise<APIResponse<any>> {
    try {
      // Backend uses /health endpoint (outside /api prefix)
      const response = await axios.get(API_BASE_URL.replace('/api', '/health'));
      return { success: true, data: response.data };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     `Server error: ${error.response.status}`;
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error: Unable to connect to server');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;
