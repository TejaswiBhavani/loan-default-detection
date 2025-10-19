/**
 * Business Rules Validation
 * Complex validation logic for loan applications
 */

/**
 * Business rule validation results
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 */

/**
 * Validate debt-to-income ratio business rules
 * @param {Object} applicantData - Applicant financial data
 * @returns {ValidationResult}
 */
function validateDebtToIncome(applicantData) {
  const errors = [];
  const warnings = [];
  
  const { existing_debts, annual_income, debt_to_income_ratio } = applicantData;
  
  if (!annual_income || annual_income <= 0) {
    errors.push('Annual income must be greater than 0 for debt-to-income calculation');
    return { isValid: false, errors, warnings };
  }
  
  if (existing_debts < 0) {
    errors.push('Existing debts cannot be negative');
  }
  
  // Calculate expected ratio
  const calculatedRatio = existing_debts / annual_income;
  
  // Verify provided ratio matches calculation (if provided)
  if (debt_to_income_ratio !== null && debt_to_income_ratio !== undefined) {
    const difference = Math.abs(debt_to_income_ratio - calculatedRatio);
    if (difference > 0.01) {
      errors.push(
        `Debt-to-income ratio mismatch: provided ${debt_to_income_ratio.toFixed(4)}, ` +
        `calculated ${calculatedRatio.toFixed(4)}`
      );
    }
  }
  
  // Business rule: DTI > 0.43 (43%) is high risk
  if (calculatedRatio > 0.43) {
    warnings.push(
      `High debt-to-income ratio (${(calculatedRatio * 100).toFixed(2)}%). ` +
      'Ratios above 43% are typically considered high risk'
    );
  }
  
  // Business rule: DTI > 0.50 is usually rejected
  if (calculatedRatio > 0.50) {
    errors.push(
      `Debt-to-income ratio (${(calculatedRatio * 100).toFixed(2)}%) exceeds maximum threshold of 50%`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate loan-to-income ratio business rules
 * @param {Object} loanData - Loan application data
 * @param {Object} applicantData - Applicant data
 * @returns {ValidationResult}
 */
function validateLoanToIncome(loanData, applicantData) {
  const errors = [];
  const warnings = [];
  
  const { loan_amount, loan_to_income_ratio } = loanData;
  const { annual_income } = applicantData;
  
  if (!annual_income || annual_income <= 0) {
    errors.push('Annual income is required for loan-to-income calculation');
    return { isValid: false, errors, warnings };
  }
  
  if (!loan_amount || loan_amount <= 0) {
    errors.push('Loan amount must be greater than 0');
    return { isValid: false, errors, warnings };
  }
  
  // Calculate expected ratio
  const calculatedRatio = loan_amount / annual_income;
  
  // Verify provided ratio matches calculation
  if (loan_to_income_ratio !== null && loan_to_income_ratio !== undefined) {
    const difference = Math.abs(loan_to_income_ratio - calculatedRatio);
    if (difference > 0.01) {
      errors.push(
        `Loan-to-income ratio mismatch: provided ${loan_to_income_ratio.toFixed(4)}, ` +
        `calculated ${calculatedRatio.toFixed(4)}`
      );
    }
  }
  
  // Business rules based on loan purpose
  const purpose = loanData.loan_purpose;
  
  if (purpose === 'home_improvement' || purpose === 'car_purchase') {
    // For secured/semi-secured loans, allow up to 5x income
    if (calculatedRatio > 5.0) {
      errors.push(
        `Loan amount (${loan_amount}) exceeds 5x annual income for ${purpose} loan`
      );
    } else if (calculatedRatio > 3.0) {
      warnings.push(
        `Loan-to-income ratio (${calculatedRatio.toFixed(2)}) is high for ${purpose} loan. ` +
        'Consider reducing loan amount or requiring additional collateral'
      );
    }
  } else {
    // For unsecured loans, stricter limits
    if (calculatedRatio > 3.0) {
      errors.push(
        `Loan amount (${loan_amount}) exceeds 3x annual income for unsecured ${purpose} loan`
      );
    } else if (calculatedRatio > 2.0) {
      warnings.push(
        `Loan-to-income ratio (${calculatedRatio.toFixed(2)}) is high for unsecured ${purpose} loan`
      );
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate employment and income consistency
 * @param {Object} applicantData - Applicant data
 * @returns {ValidationResult}
 */
function validateEmploymentIncome(applicantData) {
  const errors = [];
  const warnings = [];
  
  const {
    employment_status,
    employer_name,
    annual_income,
    monthly_income,
    employment_length_years
  } = applicantData;
  
  // Validate employed/self-employed have employer name
  if (employment_status === 'employed' || employment_status === 'self_employed') {
    if (!employer_name || employer_name.trim() === '') {
      errors.push(`Employer name is required for ${employment_status} status`);
    }
  }
  
  // Validate unemployed/student have realistic income
  if (employment_status === 'unemployed' || employment_status === 'student') {
    if (annual_income > 50000) {
      warnings.push(
        `Annual income ($${annual_income}) seems high for ${employment_status} status. ` +
        'Please verify income sources'
      );
    }
  }
  
  // Validate retired income
  if (employment_status === 'retired') {
    if (annual_income > 200000) {
      warnings.push(
        'High income for retired status. Please verify retirement income sources (pension, investments, etc.)'
      );
    }
  }
  
  // Validate monthly income consistency
  if (monthly_income && annual_income) {
    const expectedMonthly = annual_income / 12;
    const difference = Math.abs(monthly_income - expectedMonthly);
    const percentDiff = (difference / expectedMonthly) * 100;
    
    if (percentDiff > 10) {
      warnings.push(
        `Monthly income ($${monthly_income}) doesn't align with annual income ($${annual_income}). ` +
        `Expected monthly: $${expectedMonthly.toFixed(2)}`
      );
    }
  }
  
  // Validate employment length
  if (employment_length_years !== null && employment_length_years !== undefined) {
    if (employment_length_years < 0) {
      errors.push('Employment length cannot be negative');
    }
    
    if (employment_length_years === 0 && (employment_status === 'employed' || employment_status === 'self_employed')) {
      warnings.push('Less than 1 year of employment may indicate higher risk');
    }
    
    if (employment_length_years > 40) {
      warnings.push('Employment length exceeds 40 years. Please verify');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate credit profile consistency
 * @param {Object} applicantData - Applicant credit data
 * @returns {ValidationResult}
 */
function validateCreditProfile(applicantData) {
  const errors = [];
  const warnings = [];
  
  const {
    credit_score,
    credit_history_length_years,
    number_of_credit_inquiries,
    number_of_open_accounts,
    payment_history_score,
    date_of_birth
  } = applicantData;
  
  // Validate credit score range
  if (credit_score !== null && credit_score !== undefined) {
    if (credit_score < 300 || credit_score > 850) {
      errors.push('Credit score must be between 300 and 850');
    }
    
    // Credit score risk levels
    if (credit_score < 580) {
      warnings.push('Credit score below 580 indicates very high risk (Poor credit)');
    } else if (credit_score < 670) {
      warnings.push('Credit score 580-669 indicates moderate-to-high risk (Fair credit)');
    } else if (credit_score < 740) {
      warnings.push('Credit score 670-739 indicates moderate risk (Good credit)');
    }
  }
  
  // Validate credit history length vs age
  if (credit_history_length_years && date_of_birth) {
    const age = Math.floor(
      (new Date() - new Date(date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
    );
    
    const maxPossibleHistory = age - 18; // Can't have credit before 18
    
    if (credit_history_length_years > maxPossibleHistory) {
      errors.push(
        `Credit history length (${credit_history_length_years} years) cannot exceed ` +
        `age minus 18 (${maxPossibleHistory} years)`
      );
    }
    
    if (credit_history_length_years < 1) {
      warnings.push('Limited credit history (< 1 year) may indicate higher risk');
    }
  }
  
  // Validate credit inquiries
  if (number_of_credit_inquiries > 6) {
    warnings.push(
      `High number of credit inquiries (${number_of_credit_inquiries}) may indicate credit shopping or financial distress`
    );
  }
  
  if (number_of_credit_inquiries > 12) {
    errors.push(
      `Excessive credit inquiries (${number_of_credit_inquiries}) typically indicates high risk`
    );
  }
  
  // Validate open accounts
  if (number_of_open_accounts === 0 && credit_history_length_years > 0) {
    warnings.push('No open credit accounts despite having credit history. Verify data accuracy');
  }
  
  if (number_of_open_accounts > 25) {
    warnings.push(
      `High number of open accounts (${number_of_open_accounts}) may indicate over-extension`
    );
  }
  
  // Validate payment history score
  if (payment_history_score !== null && payment_history_score !== undefined) {
    if (payment_history_score < 0 || payment_history_score > 100) {
      errors.push('Payment history score must be between 0 and 100');
    }
    
    if (payment_history_score < 70) {
      warnings.push(
        `Low payment history score (${payment_history_score}) indicates past payment issues`
      );
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate loan term appropriateness
 * @param {Object} loanData - Loan application data
 * @returns {ValidationResult}
 */
function validateLoanTerm(loanData) {
  const errors = [];
  const warnings = [];
  
  const { loan_amount, loan_term_months, loan_purpose } = loanData;
  
  if (!loan_term_months || loan_term_months <= 0) {
    errors.push('Loan term must be greater than 0');
    return { isValid: false, errors, warnings };
  }
  
  // Business rules for loan term based on purpose
  const termRules = {
    car_purchase: { min: 12, max: 84, typical: 60 },
    home_improvement: { min: 12, max: 360, typical: 120 },
    debt_consolidation: { min: 12, max: 84, typical: 48 },
    business: { min: 12, max: 120, typical: 60 },
    medical: { min: 6, max: 60, typical: 36 },
    vacation: { min: 6, max: 36, typical: 24 },
    education: { min: 12, max: 240, typical: 120 },
    other: { min: 6, max: 84, typical: 48 }
  };
  
  const rules = termRules[loan_purpose] || termRules.other;
  
  if (loan_term_months < rules.min) {
    warnings.push(
      `Loan term (${loan_term_months} months) is shorter than typical for ${loan_purpose}. ` +
      `Minimum recommended: ${rules.min} months`
    );
  }
  
  if (loan_term_months > rules.max) {
    errors.push(
      `Loan term (${loan_term_months} months) exceeds maximum for ${loan_purpose}. ` +
      `Maximum allowed: ${rules.max} months`
    );
  }
  
  // Validate monthly payment is reasonable
  if (loan_amount && loan_term_months) {
    const estimatedMonthlyPayment = loan_amount / loan_term_months;
    
    if (estimatedMonthlyPayment < 50) {
      warnings.push(
        `Very low monthly payment ($${estimatedMonthlyPayment.toFixed(2)}). ` +
        'Consider shortening loan term'
      );
    }
    
    if (estimatedMonthlyPayment > 10000) {
      warnings.push(
        `High monthly payment ($${estimatedMonthlyPayment.toFixed(2)}). ` +
        'Verify borrower can afford this payment'
      );
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate age consistency
 * @param {Object} applicantData - Applicant data
 * @returns {ValidationResult}
 */
function validateAge(applicantData) {
  const errors = [];
  const warnings = [];
  
  const { date_of_birth } = applicantData;
  
  if (!date_of_birth) {
    errors.push('Date of birth is required');
    return { isValid: false, errors, warnings };
  }
  
  const birthDate = new Date(date_of_birth);
  const today = new Date();
  
  if (birthDate >= today) {
    errors.push('Date of birth cannot be in the future');
    return { isValid: false, errors, warnings };
  }
  
  const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (age < 18) {
    errors.push('Applicant must be at least 18 years old');
  }
  
  if (age > 100) {
    errors.push('Applicant age exceeds maximum allowed (100 years)');
  }
  
  if (age > 75) {
    warnings.push(
      'Applicant age exceeds typical lending age. Additional documentation may be required'
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive validation for loan application
 * @param {Object} loanData - Loan application data
 * @param {Object} applicantData - Applicant data
 * @returns {ValidationResult}
 */
function validateLoanApplication(loanData, applicantData) {
  const allErrors = [];
  const allWarnings = [];
  
  // Run all validations
  const validations = [
    validateDebtToIncome(applicantData),
    validateLoanToIncome(loanData, applicantData),
    validateEmploymentIncome(applicantData),
    validateCreditProfile(applicantData),
    validateLoanTerm(loanData),
    validateAge(applicantData)
  ];
  
  // Collect all errors and warnings
  validations.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

module.exports = {
  validateDebtToIncome,
  validateLoanToIncome,
  validateEmploymentIncome,
  validateCreditProfile,
  validateLoanTerm,
  validateAge,
  validateLoanApplication
};
