import { useState, useCallback, useEffect } from 'react';
import { LoanApplication, EnhancedDashboardMetrics, Alert, OfficerPerformance, RiskPattern, PredictionTrend } from '../types';

/**
 * Hook for managing dashboard state and data
 */
export const useLoanDashboard = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [metrics, setMetrics] = useState<EnhancedDashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/applications');
      const data = await response.json();
      setApplications(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      // Replace with actual API call
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error(err);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      // Replace with actual API call
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error(err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchApplications();
    fetchMetrics();
    fetchAlerts();
  }, [fetchApplications, fetchMetrics, fetchAlerts]);

  return {
    applications,
    metrics,
    alerts,
    loading,
    error,
    refresh: async () => {
      await Promise.all([fetchApplications(), fetchMetrics(), fetchAlerts()]);
    },
  };
};

/**
 * Hook for managing application filtering and sorting
 */
export const useApplicationFilter = (applications: LoanApplication[]) => {
  const [filteredApplications, setFilteredApplications] = useState<LoanApplication[]>(applications);
  const [sortBy, setSortBy] = useState<'risk' | 'amount' | 'date' | 'priority'>('priority');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  useEffect(() => {
    let filtered = applications;

    // Apply status filter
    if (filterType !== 'all') {
      filtered = filtered.filter((app) => app.workflow.status === filterType);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          return b.aiAnalysis.riskScore - a.aiAnalysis.riskScore;
        case 'amount':
          return b.loanDetails.loanAmount - a.loanDetails.loanAmount;
        case 'date':
          return new Date(b.applicant.applicationDate).getTime() - new Date(a.applicant.applicationDate).getTime();
        case 'priority':
          const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityMap[a.workflow.priority as keyof typeof priorityMap] - priorityMap[b.workflow.priority as keyof typeof priorityMap];
        default:
          return 0;
      }
    });

    setFilteredApplications(sorted);
  }, [applications, sortBy, filterType]);

  return {
    filteredApplications,
    sortBy,
    setSortBy,
    filterType,
    setFilterType,
  };
};

/**
 * Hook for managing analytics data
 */
export const useAnalytics = () => {
  const [performance, setPerformance] = useState<OfficerPerformance | null>(null);
  const [riskPatterns, setRiskPatterns] = useState<RiskPattern[]>([]);
  const [predictionTrends, setPredictionTrends] = useState<PredictionTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (timeRange: '7days' | '30days' | '90days' = '30days') => {
    setLoading(true);
    try {
      // Replace with actual API call
      const [perfRes, patternsRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics/performance?range=${timeRange}`),
        fetch(`/api/analytics/patterns?range=${timeRange}`),
        fetch(`/api/analytics/trends?range=${timeRange}`),
      ]);

      const [perfData, patternsData, trendsData] = await Promise.all([
        perfRes.json(),
        patternsRes.json(),
        trendsRes.json(),
      ]);

      setPerformance(perfData);
      setRiskPatterns(patternsData);
      setPredictionTrends(trendsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    performance,
    riskPatterns,
    predictionTrends,
    loading,
    error,
    refresh: fetchAnalytics,
  };
};

/**
 * Hook for managing decision state
 */
export const useApplicationDecision = (applicationId: string) => {
  const [decision, setDecision] = useState<'APPROVED' | 'DENIED' | 'PENDING' | null>(null);
  const [notes, setNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDecision = useCallback(
    async (
      decisionType: 'APPROVED' | 'DENIED' | 'PENDING'
    ) => {
      setLoading(true);
      try {
        // Replace with actual API call
        const response = await fetch(`/api/applications/${applicationId}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: decisionType,
            notes,
            overrideReason,
          }),
        });

        if (!response.ok) throw new Error('Failed to submit decision');

        setDecision(decisionType);
        setError(null);
        return true;
      } catch (err) {
        setError('Failed to submit decision');
        console.error(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applicationId, notes, overrideReason]
  );

  const saveDraft = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          overrideReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save draft');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [applicationId, notes, overrideReason]);

  return {
    decision,
    notes,
    setNotes,
    overrideReason,
    setOverrideReason,
    submitDecision,
    saveDraft,
    loading,
    error,
  };
};

/**
 * Hook for batch processing
 */
export const useBatchProcessing = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/batch/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setJobId(data.jobId);
      setStatus('processing');
      setError(null);
      return data.jobId;
    } catch (err) {
      setError('Failed to upload file');
      setStatus('error');
      console.error(err);
      return null;
    }
  }, []);

  const processWithFilters = useCallback(async (jobIdParam: string, filters: any) => {
    try {
      const response = await fetch(`/api/batch/${jobIdParam}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error('Processing failed');

      const data = await response.json();
      setStatus('completed');
      setProgress(100);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to process batch');
      setStatus('error');
      console.error(err);
      return null;
    }
  }, []);

  return {
    file,
    status,
    progress,
    error,
    jobId,
    uploadFile,
    processWithFilters,
    reset: () => {
      setFile(null);
      setStatus('idle');
      setProgress(0);
      setError(null);
      setJobId(null);
    },
  };
};

/**
 * Hook for managing alerts
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    fetchAlerts,
    acknowledgeAlert,
    dismissAlert,
  };
};
