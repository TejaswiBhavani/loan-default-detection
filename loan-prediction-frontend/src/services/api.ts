import axios, { AxiosInstance, AxiosResponse } from 'axios';
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

class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth (if needed)
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
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
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Single prediction
  async predictSingle(applicantData: Applicant): Promise<APIResponse<PredictionResult>> {
    try {
      const response: AxiosResponse<APIResponse<PredictionResult>> = await this.api.post(
        '/predict/single',
        applicantData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Batch prediction upload
  async uploadBatchFile(file: File): Promise<APIResponse<BatchJob>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response: AxiosResponse<APIResponse<BatchJob>> = await this.api.post(
        '/predict/batch',
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

  // Get batch job status
  async getBatchJobStatus(jobId: string): Promise<APIResponse<BatchJob>> {
    try {
      const response: AxiosResponse<APIResponse<BatchJob>> = await this.api.get(
        `/batch/${jobId}`
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

  // Get predictions with filters
  async getPredictions(
    filters?: FilterOptions,
    page: number = 1,
    perPage: number = 20
  ): Promise<APIResponse<PaginatedResponse<PredictionResult>>> {
    try {
      const response: AxiosResponse<APIResponse<PaginatedResponse<PredictionResult>>> = 
        await this.api.get('/predictions', {
          params: {
            ...filters,
            page,
            per_page: perPage
          }
        });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single prediction
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

  // Get model metrics
  async getModelMetrics(): Promise<APIResponse<ModelMetrics>> {
    try {
      const response: AxiosResponse<APIResponse<ModelMetrics>> = await this.api.get(
        '/model/metrics'
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

  // System health check
  async checkSystemHealth(): Promise<APIResponse<any>> {
    try {
      const response: AxiosResponse<APIResponse<any>> = await this.api.get('/system/status');
      return response.data;
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
