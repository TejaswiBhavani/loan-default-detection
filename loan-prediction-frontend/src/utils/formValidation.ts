/**
 * Form Validation Utilities
 * Matching backend validation rules from the API
 */

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export interface ApplicantFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  income: number;
  employment_status: string;
  employment_length: number;
  education_level: string;
  loan_amount: number;
  loan_purpose: string;
  loan_term: number;
  existing_debts: number;
  assets_value: number;
  debt_to_income_ratio: number;
  credit_score: number;
  credit_history_length: number;
  number_of_credit_inquiries: number;
  number_of_open_accounts: number;
  payment_history_score: number;
}

// Validation constraints matching backend
export const VALIDATION_RULES = {
  // Personal Info
  age: { min: 18, max: 100 },
  income: { min: 0, max: 10000000 },
  employment_length: { min: 0, max: 50 },
  
  // Financial Info
  loan_amount: { min: 1000, max: 1000000 },
  loan_term: { min: 6, max: 360 }, // months
  existing_debts: { min: 0, max: 5000000 },
  assets_value: { min: 0, max: 50000000 },
  debt_to_income_ratio: { min: 0, max: 1 },
  
  // Credit Info
  credit_score: { min: 300, max: 850 },
  credit_history_length: { min: 0, max: 50 },
  number_of_credit_inquiries: { min: 0, max: 50 },
  number_of_open_accounts: { min: 0, max: 50 },
  payment_history_score: { min: 0, max: 100 },
};

// Enums matching backend
export const EMPLOYMENT_STATUS = [
  'employed',
  'self-employed',
  'unemployed',
  'retired',
  'student',
];

export const EDUCATION_LEVEL = [
  'high-school',
  'bachelor',
  'master',
  'phd',
  'other',
];

export const LOAN_PURPOSE = [
  'debt-consolidation',
  'home-improvement',
  'car',
  'business',
  'medical',
  'education',
  'vacation',
  'other',
];

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  // Allow various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate number is within range
 */
export const validateRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate required field
 */
export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

/**
 * Validate applicant personal information
 */
export const validatePersonalInfo = (data: Partial<ApplicantFormData>): ValidationResult => {
  const errors: { [key: string]: string } = {};

  // First name
  if (!validateRequired(data.first_name)) {
    errors.first_name = 'First name is required';
  } else if (data.first_name && data.first_name.length < 2) {
    errors.first_name = 'First name must be at least 2 characters';
  } else if (data.first_name && data.first_name.length > 50) {
    errors.first_name = 'First name must not exceed 50 characters';
  }

  // Last name
  if (!validateRequired(data.last_name)) {
    errors.last_name = 'Last name is required';
  } else if (data.last_name && data.last_name.length < 2) {
    errors.last_name = 'Last name must be at least 2 characters';
  } else if (data.last_name && data.last_name.length > 50) {
    errors.last_name = 'Last name must not exceed 50 characters';
  }

  // Email
  if (!validateRequired(data.email)) {
    errors.email = 'Email is required';
  } else if (data.email && !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Age
  if (!validateRequired(data.age)) {
    errors.age = 'Age is required';
  } else if (data.age && !validateRange(data.age, VALIDATION_RULES.age.min, VALIDATION_RULES.age.max)) {
    errors.age = `Age must be between ${VALIDATION_RULES.age.min} and ${VALIDATION_RULES.age.max}`;
  }

  // Income
  if (!validateRequired(data.income)) {
    errors.income = 'Annual income is required';
  } else if (data.income && !validateRange(data.income, VALIDATION_RULES.income.min, VALIDATION_RULES.income.max)) {
    errors.income = `Income must be between $${VALIDATION_RULES.income.min.toLocaleString()} and $${VALIDATION_RULES.income.max.toLocaleString()}`;
  }

  // Employment status
  if (!validateRequired(data.employment_status)) {
    errors.employment_status = 'Employment status is required';
  } else if (data.employment_status && !EMPLOYMENT_STATUS.includes(data.employment_status)) {
    errors.employment_status = 'Invalid employment status';
  }

  // Employment length
  if (data.employment_length !== undefined && !validateRange(data.employment_length, VALIDATION_RULES.employment_length.min, VALIDATION_RULES.employment_length.max)) {
    errors.employment_length = `Employment length must be between ${VALIDATION_RULES.employment_length.min} and ${VALIDATION_RULES.employment_length.max} years`;
  }

  // Education level
  if (!validateRequired(data.education_level)) {
    errors.education_level = 'Education level is required';
  } else if (data.education_level && !EDUCATION_LEVEL.includes(data.education_level)) {
    errors.education_level = 'Invalid education level';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate applicant financial information
 */
export const validateFinancialInfo = (data: Partial<ApplicantFormData>): ValidationResult => {
  const errors: { [key: string]: string } = {};

  // Loan amount
  if (!validateRequired(data.loan_amount)) {
    errors.loan_amount = 'Loan amount is required';
  } else if (data.loan_amount && !validateRange(data.loan_amount, VALIDATION_RULES.loan_amount.min, VALIDATION_RULES.loan_amount.max)) {
    errors.loan_amount = `Loan amount must be between $${VALIDATION_RULES.loan_amount.min.toLocaleString()} and $${VALIDATION_RULES.loan_amount.max.toLocaleString()}`;
  }

  // Loan purpose
  if (!validateRequired(data.loan_purpose)) {
    errors.loan_purpose = 'Loan purpose is required';
  } else if (data.loan_purpose && !LOAN_PURPOSE.includes(data.loan_purpose)) {
    errors.loan_purpose = 'Invalid loan purpose';
  }

  // Loan term
  if (!validateRequired(data.loan_term)) {
    errors.loan_term = 'Loan term is required';
  } else if (data.loan_term && !validateRange(data.loan_term, VALIDATION_RULES.loan_term.min, VALIDATION_RULES.loan_term.max)) {
    errors.loan_term = `Loan term must be between ${VALIDATION_RULES.loan_term.min} and ${VALIDATION_RULES.loan_term.max} months`;
  }

  // Existing debts
  if (data.existing_debts !== undefined && !validateRange(data.existing_debts, VALIDATION_RULES.existing_debts.min, VALIDATION_RULES.existing_debts.max)) {
    errors.existing_debts = `Existing debts must be between $${VALIDATION_RULES.existing_debts.min.toLocaleString()} and $${VALIDATION_RULES.existing_debts.max.toLocaleString()}`;
  }

  // Assets value
  if (data.assets_value !== undefined && !validateRange(data.assets_value, VALIDATION_RULES.assets_value.min, VALIDATION_RULES.assets_value.max)) {
    errors.assets_value = `Assets value must be between $${VALIDATION_RULES.assets_value.min.toLocaleString()} and $${VALIDATION_RULES.assets_value.max.toLocaleString()}`;
  }

  // Debt to income ratio
  if (data.debt_to_income_ratio !== undefined && !validateRange(data.debt_to_income_ratio, VALIDATION_RULES.debt_to_income_ratio.min, VALIDATION_RULES.debt_to_income_ratio.max)) {
    errors.debt_to_income_ratio = `Debt-to-income ratio must be between ${VALIDATION_RULES.debt_to_income_ratio.min} and ${VALIDATION_RULES.debt_to_income_ratio.max}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate applicant credit information
 */
export const validateCreditInfo = (data: Partial<ApplicantFormData>): ValidationResult => {
  const errors: { [key: string]: string } = {};

  // Credit score
  if (!validateRequired(data.credit_score)) {
    errors.credit_score = 'Credit score is required';
  } else if (data.credit_score && !validateRange(data.credit_score, VALIDATION_RULES.credit_score.min, VALIDATION_RULES.credit_score.max)) {
    errors.credit_score = `Credit score must be between ${VALIDATION_RULES.credit_score.min} and ${VALIDATION_RULES.credit_score.max}`;
  }

  // Credit history length
  if (data.credit_history_length !== undefined && !validateRange(data.credit_history_length, VALIDATION_RULES.credit_history_length.min, VALIDATION_RULES.credit_history_length.max)) {
    errors.credit_history_length = `Credit history length must be between ${VALIDATION_RULES.credit_history_length.min} and ${VALIDATION_RULES.credit_history_length.max} years`;
  }

  // Number of credit inquiries
  if (data.number_of_credit_inquiries !== undefined && !validateRange(data.number_of_credit_inquiries, VALIDATION_RULES.number_of_credit_inquiries.min, VALIDATION_RULES.number_of_credit_inquiries.max)) {
    errors.number_of_credit_inquiries = `Number of credit inquiries must be between ${VALIDATION_RULES.number_of_credit_inquiries.min} and ${VALIDATION_RULES.number_of_credit_inquiries.max}`;
  }

  // Number of open accounts
  if (data.number_of_open_accounts !== undefined && !validateRange(data.number_of_open_accounts, VALIDATION_RULES.number_of_open_accounts.min, VALIDATION_RULES.number_of_open_accounts.max)) {
    errors.number_of_open_accounts = `Number of open accounts must be between ${VALIDATION_RULES.number_of_open_accounts.min} and ${VALIDATION_RULES.number_of_open_accounts.max}`;
  }

  // Payment history score
  if (data.payment_history_score !== undefined && !validateRange(data.payment_history_score, VALIDATION_RULES.payment_history_score.min, VALIDATION_RULES.payment_history_score.max)) {
    errors.payment_history_score = `Payment history score must be between ${VALIDATION_RULES.payment_history_score.min} and ${VALIDATION_RULES.payment_history_score.max}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate entire applicant form
 */
export const validateApplicantForm = (data: Partial<ApplicantFormData>): ValidationResult => {
  const personalResult = validatePersonalInfo(data);
  const financialResult = validateFinancialInfo(data);
  const creditResult = validateCreditInfo(data);

  const allErrors = {
    ...personalResult.errors,
    ...financialResult.errors,
    ...creditResult.errors,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
};

/**
 * Calculate debt-to-income ratio
 */
export const calculateDebtToIncomeRatio = (
  monthlyDebt: number,
  monthlyIncome: number
): number => {
  if (monthlyIncome === 0) return 0;
  return Number((monthlyDebt / monthlyIncome).toFixed(4));
};

/**
 * Auto-calculate DTI from annual income, loan amount, loan term, and existing debts
 */
export const autoCalculateDTI = (
  annualIncome: number,
  loanAmount: number,
  loanTermMonths: number,
  existingDebts: number
): number => {
  if (annualIncome === 0 || loanTermMonths === 0) return 0;
  
  const monthlyIncome = annualIncome / 12;
  const monthlyLoanPayment = loanAmount / loanTermMonths;
  const totalMonthlyDebt = monthlyLoanPayment + (existingDebts / 12);
  
  return calculateDebtToIncomeRatio(totalMonthlyDebt, monthlyIncome);
};
