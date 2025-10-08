// Application constants

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Risk Categories
export const RISK_CATEGORIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

// Risk Thresholds (default values)
export const DEFAULT_RISK_THRESHOLDS = {
  LOW_MAX: 0.3,
  MEDIUM_MAX: 0.7
} as const;

// Recommendation Types
export const RECOMMENDATIONS = {
  APPROVE: 'approve',
  REVIEW: 'review',
  REJECT: 'reject'
} as const;

// Employment Status Options
export const EMPLOYMENT_STATUS = {
  EMPLOYED: 'employed',
  SELF_EMPLOYED: 'self-employed',
  UNEMPLOYED: 'unemployed',
  RETIRED: 'retired'
} as const;

// Education Level Options
export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: 'high-school',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  PHD: 'phd',
  OTHER: 'other'
} as const;

// Loan Purpose Options
export const LOAN_PURPOSES = {
  DEBT_CONSOLIDATION: 'debt-consolidation',
  HOME_IMPROVEMENT: 'home-improvement',
  CAR: 'car',
  BUSINESS: 'business',
  OTHER: 'other'
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['.csv', 'text/csv'],
  BATCH_TEMPLATE_FILENAME: 'loan_application_template.csv'
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  BATCH_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100
} as const;

// Toast Notification Duration
export const TOAST_DURATION = 5000; // 5 seconds

// Polling Intervals
export const POLLING_INTERVALS = {
  BATCH_JOB_STATUS: 2000, // 2 seconds
  DASHBOARD_METRICS: 30000 // 30 seconds
} as const;

// Color Schemes
export const COLORS = {
  RISK: {
    LOW: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      primary: '#10B981'
    },
    MEDIUM: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      primary: '#F59E0B'
    },
    HIGH: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      primary: '#EF4444'
    }
  },
  RECOMMENDATION: {
    APPROVE: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    REVIEW: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    REJECT: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    }
  }
} as const;

// Feature Names for Display
export const FEATURE_DISPLAY_NAMES = {
  age: 'Age',
  income: 'Annual Income',
  employment_status: 'Employment Status',
  employment_length: 'Employment Length',
  education_level: 'Education Level',
  loan_amount: 'Loan Amount',
  loan_purpose: 'Loan Purpose',
  loan_term: 'Loan Term',
  existing_debts: 'Existing Debts',
  assets_value: 'Assets Value',
  debt_to_income_ratio: 'Debt-to-Income Ratio',
  credit_score: 'Credit Score',
  credit_history_length: 'Credit History Length',
  number_of_credit_inquiries: 'Credit Inquiries',
  number_of_open_accounts: 'Open Accounts',
  payment_history_score: 'Payment History Score'
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#6366F1'
  },
  ANIMATION_DURATION: 300
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  DRAFT_APPLICATION: 'draft_application'
} as const;

// Routes
export const ROUTES = {
  DASHBOARD: '/dashboard',
  SINGLE_ASSESSMENT: '/assess/single',
  BATCH_PROCESSING: '/assess/batch',
  PREDICTION_HISTORY: '/history',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings'
} as const;
