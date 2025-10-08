// Core application types for loan prediction system

export interface Applicant {
  id?: string;
  personalInfo: {
    age: number;
    income: number;
    employment_status: 'employed' | 'self-employed' | 'unemployed' | 'retired';
    employment_length: number; // years
    education_level: 'high-school' | 'bachelor' | 'master' | 'phd' | 'other';
  };
  financialInfo: {
    loan_amount: number;
    loan_purpose: 'debt-consolidation' | 'home-improvement' | 'car' | 'business' | 'other';
    loan_term: number; // months
    existing_debts: number;
    assets_value: number;
    debt_to_income_ratio: number;
  };
  creditInfo: {
    credit_score: number;
    credit_history_length: number; // years
    number_of_credit_inquiries: number;
    number_of_open_accounts: number;
    payment_history_score: number; // 0-100
  };
}

export interface PredictionResult {
  id: string;
  applicant_id: string;
  risk_score: number; // 0-1 probability
  risk_category: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  feature_importance: FeatureImportance[];
  recommendation: 'approve' | 'review' | 'reject';
  created_at: string;
  processed_by?: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  impact: 'positive' | 'negative';
  display_name: string;
}

export interface BatchJob {
  id: string;
  filename: string;
  total_records: number;
  processed_records: number;
  successful_predictions: number;
  failed_predictions: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  created_at: string;
  completed_at?: string;
  results?: BatchResult[];
  errors?: BatchError[];
}

export interface BatchResult {
  row_number: number;
  applicant_data: Applicant;
  prediction: PredictionResult;
  status: 'success' | 'error';
}

export interface BatchError {
  row_number: number;
  error_message: string;
  field_errors?: { [key: string]: string };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix: number[][];
  feature_importance_global: FeatureImportance[];
  model_version: string;
  last_updated: string;
}

export interface DashboardMetrics {
  total_predictions: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  approval_rate: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
}

export interface UserPreferences {
  risk_thresholds: {
    low_max: number;
    medium_max: number;
  };
  notifications_enabled: boolean;
  default_page_size: number;
  theme: 'light' | 'dark' | 'system';
}

export interface FilterOptions {
  date_range?: {
    start?: string;
    end?: string;
  };
  risk_categories?: ('low' | 'medium' | 'high')[];
  recommendations?: ('approve' | 'review' | 'reject')[];
  processed_by?: string;
  min_loan_amount?: number;
  max_loan_amount?: number;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: FilterOptions;
  columns?: string[];
  include_metadata?: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: ValidationError[];
}

// Chart data types
export interface RiskDistributionData {
  category: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  approvals: number;
  rejections: number;
  reviews: number;
  average_risk: number;
}

// Analytics types
export interface AnalyticsState {
  loading: boolean;
  modelMetrics: ModelMetrics | null;
  dashboardMetrics: DashboardMetrics | null;
  trendData: TrendData[];
  riskDistribution: RiskDistributionData[];
  error: string | null;
  lastUpdated: Date | null;
  selectedTimeRange: 'week' | 'month' | 'quarter' | 'year';
}



export interface TrendData {
  date: string;
  approvals: number;
  rejections: number;
  reviews: number;
  average_risk: number;
}

export interface RiskDistributionData {
  category: string;
  count: number;
  percentage: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  auto_dismiss?: boolean;
}
