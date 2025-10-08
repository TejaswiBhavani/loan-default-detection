import { useState, useEffect, useCallback } from 'react';
import { PredictionResult, FilterOptions, APIResponse, PaginatedResponse } from '../types';
import apiService from '../services/api';
import { debounce } from '../utils/formatters';

interface UsePredictionsOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

interface UsePredictionsReturn {
  predictions: PredictionResult[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  loadPredictions: (page?: number, filters?: FilterOptions) => Promise<void>;
  clearError: () => void;
}

export const usePredictions = (options: UsePredictionsOptions = {}): UsePredictionsReturn => {
  const { pageSize = 20, autoLoad = true } = options;
  
  const [state, setState] = useState({
    predictions: [] as PredictionResult[],
    loading: false,
    error: null as string | null,
    totalPages: 1,
    totalItems: 0,
    currentPage: 1
  });

  const loadPredictions = useCallback(async (
    page: number = 1, 
    filters: FilterOptions = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: APIResponse<PaginatedResponse<PredictionResult>> = 
        await apiService.getPredictions(filters, page, pageSize);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          predictions: response.data!.data,
          totalPages: response.data!.total_pages,
          totalItems: response.data!.total,
          currentPage: response.data!.page,
          loading: false
        }));
      } else {
        throw new Error(response.message || 'Failed to load predictions');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load predictions'
      }));
    }
  }, [pageSize]);

  const debouncedLoadPredictions = useCallback(
    debounce(loadPredictions, 300),
    [loadPredictions]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadPredictions();
    }
  }, [loadPredictions, autoLoad]);

  return {
    ...state,
    loadPredictions,
    clearError
  };
};

export default usePredictions;
