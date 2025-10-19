/**
 * Data Sanitization Utilities
 * Provides additional layers of security and data normalization
 */

const validator = require('validator');

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
function sanitizeText(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Escape HTML entities
  let sanitized = validator.escape(input);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Normalize multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

/**
 * Normalize email address
 * @param {string} email - Email address
 * @returns {string} Normalized email
 */
function normalizeEmail(email) {
  if (!email) return email;
  
  return validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false
  });
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone) return phone;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Add +1 for US numbers if not present
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  return phone;
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize file upload path to prevent directory traversal
 * @param {string} filename - Uploaded filename
 * @returns {string} Safe filename
 */
function sanitizeFilename(filename) {
  if (!filename) return filename;
  
  // Remove directory traversal attempts
  let safe = filename.replace(/^.*[\\\/]/, '');
  
  // Remove special characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    safe = safe.substring(0, 250) + '.' + ext;
  }
  
  return safe;
}

/**
 * Validate and sanitize currency amount
 * @param {number} amount - Currency amount
 * @param {number} maxAmount - Maximum allowed amount
 * @returns {number|null} Sanitized amount or null if invalid
 */
function sanitizeCurrency(amount, maxAmount = 10000000) {
  if (amount === null || amount === undefined) {
    return null;
  }

  const num = parseFloat(amount);
  
  if (isNaN(num) || num < 0 || num > maxAmount) {
    return null;
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

/**
 * Validate SSN last 4 digits
 * @param {string} ssn - SSN last 4 digits
 * @returns {string|null} Validated SSN or null
 */
function validateSSN(ssn) {
  if (!ssn) return null;
  
  const digitsOnly = ssn.replace(/\D/g, '');
  
  if (digitsOnly.length !== 4) {
    return null;
  }
  
  return digitsOnly;
}

/**
 * Sanitize ZIP code
 * @param {string} zipCode - ZIP code
 * @returns {string|null} Sanitized ZIP code
 */
function sanitizeZipCode(zipCode) {
  if (!zipCode) return null;
  
  const digitsAndHyphen = zipCode.replace(/[^0-9-]/g, '');
  
  // Match 5-digit or 9-digit ZIP
  const match = digitsAndHyphen.match(/^(\d{5})(-\d{4})?$/);
  
  return match ? match[0] : null;
}

/**
 * Validate and normalize ratio
 * @param {number} ratio - Ratio value
 * @param {number} maxRatio - Maximum allowed ratio
 * @returns {number|null} Normalized ratio or null
 */
function sanitizeRatio(ratio, maxRatio = 10) {
  if (ratio === null || ratio === undefined) {
    return null;
  }

  const num = parseFloat(ratio);
  
  if (isNaN(num) || num < 0 || num > maxRatio) {
    return null;
  }

  // Round to 4 decimal places
  return Math.round(num * 10000) / 10000;
}

/**
 * Sanitize integer value
 * @param {number} value - Integer value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number|null} Sanitized integer or null
 */
function sanitizeInteger(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined) {
    return null;
  }

  const num = parseInt(value, 10);
  
  if (isNaN(num) || num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Remove potentially dangerous SQL characters (defense in depth)
 * Note: This should NEVER replace parameterized queries
 * @param {string} input - Input string
 * @returns {string} Cleaned string
 */
function preventSQLInjection(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove common SQL injection patterns
  let cleaned = input.replace(/['";\\]/g, '');
  
  // Remove SQL comments
  cleaned = cleaned.replace(/--/g, '');
  cleaned = cleaned.replace(/\/\*/g, '');
  cleaned = cleaned.replace(/\*\//g, '');
  
  return cleaned;
}

/**
 * Deep freeze an object to prevent modifications
 * @param {Object} obj - Object to freeze
 * @returns {Object} Frozen object
 */
function deepFreeze(obj) {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null
      && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
      && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });

  return obj;
}

/**
 * Sanitize applicant data before database insertion
 * @param {Object} applicantData - Raw applicant data
 * @returns {Object} Sanitized applicant data
 */
function sanitizeApplicantData(applicantData) {
  const sanitized = { ...applicantData };

  // Text fields
  const textFields = [
    'first_name', 'last_name', 'address_line_1', 'address_line_2',
    'city', 'employer_name', 'job_title', 'education_level'
  ];
  
  textFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  });

  // Email
  if (sanitized.email) {
    sanitized.email = normalizeEmail(sanitized.email);
  }

  // Phone
  if (sanitized.phone) {
    sanitized.phone = normalizePhone(sanitized.phone);
  }

  // SSN
  if (sanitized.ssn_last_4) {
    sanitized.ssn_last_4 = validateSSN(sanitized.ssn_last_4);
  }

  // ZIP code
  if (sanitized.zip_code) {
    sanitized.zip_code = sanitizeZipCode(sanitized.zip_code);
  }

  // Currency fields
  const currencyFields = [
    'annual_income', 'monthly_income', 'existing_debts',
    'assets_value', 'savings_account_balance'
  ];
  
  currencyFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeCurrency(sanitized[field]);
    }
  });

  // Ratios
  if (sanitized.debt_to_income_ratio !== undefined) {
    sanitized.debt_to_income_ratio = sanitizeRatio(sanitized.debt_to_income_ratio, 5);
  }

  // Integers
  const integerFields = [
    'credit_score', 'number_of_credit_inquiries', 'number_of_open_accounts'
  ];
  
  integerFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      const limits = {
        credit_score: [300, 850],
        number_of_credit_inquiries: [0, 100],
        number_of_open_accounts: [0, 100]
      };
      
      if (limits[field]) {
        sanitized[field] = sanitizeInteger(sanitized[field], limits[field][0], limits[field][1]);
      }
    }
  });

  return sanitized;
}

/**
 * Sanitize loan application data
 * @param {Object} loanData - Raw loan application data
 * @returns {Object} Sanitized loan data
 */
function sanitizeLoanData(loanData) {
  const sanitized = { ...loanData };

  // Currency
  if (sanitized.loan_amount !== undefined) {
    sanitized.loan_amount = sanitizeCurrency(sanitized.loan_amount, 10000000);
  }

  // Ratios
  if (sanitized.loan_to_income_ratio !== undefined) {
    sanitized.loan_to_income_ratio = sanitizeRatio(sanitized.loan_to_income_ratio, 10);
  }

  if (sanitized.requested_interest_rate !== undefined) {
    sanitized.requested_interest_rate = sanitizeRatio(sanitized.requested_interest_rate, 0.5);
  }

  // Text fields
  if (sanitized.applicant_notes) {
    sanitized.applicant_notes = sanitizeText(sanitized.applicant_notes);
  }

  if (sanitized.decision_reason) {
    sanitized.decision_reason = sanitizeText(sanitized.decision_reason);
  }

  if (sanitized.internal_notes) {
    sanitized.internal_notes = sanitizeText(sanitized.internal_notes);
  }

  return sanitized;
}

module.exports = {
  sanitizeText,
  normalizeEmail,
  normalizePhone,
  sanitizeObject,
  sanitizeFilename,
  sanitizeCurrency,
  validateSSN,
  sanitizeZipCode,
  sanitizeRatio,
  sanitizeInteger,
  preventSQLInjection,
  deepFreeze,
  sanitizeApplicantData,
  sanitizeLoanData
};
