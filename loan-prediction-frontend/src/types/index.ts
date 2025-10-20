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

// ============================================
// NEW COMPREHENSIVE TYPES FOR SMART DASHBOARD
// ============================================

// Applicant Profile
export interface ApplicantProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  applicationSource: 'online_portal' | 'branch' | 'phone' | 'broker' | 'crm';
  applicationDate: Date;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired' | 'student';
  employerName?: string;
  employmentLength: number; // years
  dependents: number;
}

// Financial Snapshot
export interface FinancialSnapshot {
  annualIncome: number;
  incomeVerification: 'w2' | 'tax_return' | 'paystub' | 'bank_statement' | 'unverified';
  currentDebt: number;
  debtToIncomeRatio: number;
  creditScore: number;
  creditScoreSource: 'experian' | 'equifax' | 'transunion' | 'average';
  creditHistoryLength: number; // years
  housingPayment: number;
  otherMonthlyPayments: number;
  assets: {
    checking: number;
    savings: number;
    investments: number;
    realEstate: number;
  };
  totalAssets: number;
  recentCreditInquiries: number;
  openAccounts: number;
  paymentHistoryScore: number; // 0-100
}

// Loan Terms
export interface LoanTerms {
  id: string;
  loanAmount: number;
  purpose: 'home_improvement' | 'auto' | 'personal' | 'business' | 'debt_consolidation' | 'education' | 'other';
  term: number; // months
  estimatedInterestRate: number; // percentage
  previousLoans: {
    type: string;
    amount: number;
    status: 'paid' | 'current' | 'defaulted' | 'delinquent';
  }[];
  collateral?: {
    type: string;
    estimatedValue: number;
  };
  loanToValueRatio?: number;
}

// Decision Factor for AI Analysis
export interface DecisionFactor {
  category: 'strength' | 'consideration' | 'risk';
  title: string;
  description: string;
  impact: number; // 0-1, weight of this factor
  data_point?: string; // reference to actual data
}

// Comparable Case
export interface CaseComparison {
  similarProfiles: number;
  defaultRate: number;
  approvalRate: number;
  officerApprovalRate: number;
  departmentApprovalRate: number;
}

// AI Analysis
export interface AIAnalysis {
  riskScore: number; // 0-100
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100 (%)
  recommendation: 'APPROVE' | 'REVIEW' | 'DENY';
  keyFactors: DecisionFactor[];
  comparableCases: CaseComparison;
  modelVersion: string;
  analysisTimestamp: Date;
  explanation: string; // Human-readable explanation
}

// Officer Decision
export interface OfficerDecision {
  decision: 'APPROVED' | 'DENIED' | 'PENDING' | 'DRAFT';
  overrideReason?: string;
  notes: string;
  timestamp: Date;
  officerId: string;
  officerName: string;
  agreedWithAI: boolean;
}

// Workflow Status
export interface WorkflowStatus {
  status: 'new' | 'review' | 'approved' | 'denied' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  slaDeadline: Date;
  assignedOfficer: string;
  escalatedTo?: string;
  createdAt: Date;
  lastModified: Date;
}

// Complete Loan Application
export interface LoanApplication {
  id: string;
  applicant: ApplicantProfile;
  financials: FinancialSnapshot;
  loanDetails: LoanTerms;
  aiAnalysis: AIAnalysis;
  officerDecision?: OfficerDecision;
  workflow: WorkflowStatus;
  documents?: {
    type: string;
    url: string;
    uploadDate: Date;
    verified: boolean;
  }[];
  auditTrail?: {
    action: string;
    actor: string;
    timestamp: Date;
    details: string;
  }[];
}

// Dashboard Metrics (Enhanced)
export interface EnhancedDashboardMetrics {
  active: number;
  pendingReview: number;
  urgent: number;
  todayProcessed: number;
  todayTotal: number;
  myApprovalRate: number;
  aiAgreementRate: number;
  myDefaultRate: number;
  teamDefaultRate: number;
  avgProcessingTime: number; // minutes
  teamAvgProcessingTime: number; // minutes
  overrideRate: number;
  overrideSuccessRate: number;
}

// Alert
export interface Alert {
  id: string;
  type: 'deadline' | 'escalation' | 'pattern' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  applicationId?: string;
  actionUrl?: string;
  timestamp: Date;
  acknowledged: boolean;
}

// Batch Processing
export interface BatchProcessingJob {
  id: string;
  fileName: string;
  uploadDate: Date;
  status: 'validating' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  readyForProcessing: number;
  requiresDocumentation: number;
  missingData: number;
  results?: BatchProcessingResult[];
  smartFilters?: SmartFilterConfig;
}

export interface SmartFilterConfig {
  autoApprove: {
    enabled: boolean;
    maxRisk: number;
    maxAmount: number;
    maxDTI: number;
  };
  flagForReview: {
    enabled: boolean;
    minRisk: number;
    maxRisk: number;
    minExperience: number;
  };
  escalateRequired: {
    enabled: boolean;
    minRisk: number;
    minAmount: number;
  };
  highlights: {
    recentAddressChange: boolean;
    multipleInquiries: boolean;
    firstTimeApplicant: boolean;
  };
}

export interface BatchProcessingResult {
  applicationId: string;
  applicantName: string;
  loanAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  aiRecommendation: 'approve' | 'review' | 'deny';
  smartTags: string[];
  action: 'auto_approved' | 'flagged' | 'escalated' | 'pending';
}

// Officer Performance Metrics
export interface OfficerPerformance {
  decisionAccuracy: number; // %
  overrideCount: number;
  overrideSuccessRate: number; // %
  avgProcessingTime: number; // minutes
  totalDecisions: number;
  approvalRate: number; // %
  defaultRate: number; // %
  strongAreas: string[];
  comparisonToTeam: {
    moreApprovalsPercentage: number;
    accuracyDifference: number;
    processingTimeComparison: number; // seconds difference
  };
}

// Risk Pattern
export interface RiskPattern {
  pattern: string;
  affectedCount: number;
  defaultRateVariation: number; // percentage change
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

// Prediction Trend
export interface PredictionTrend {
  category: string;
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  description: string;
}

// Mobile Swipe Card
export interface SwipeCard {
  application: LoanApplication;
  displayName: string;
  displayLoanAmount: string;
  displayRisk: string;
  recommendation: string;
  quickFacts: string[];
}
