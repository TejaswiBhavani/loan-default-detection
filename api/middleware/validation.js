/**
 * Input Validation Schemas using Joi
 */

const Joi = require('joi');

// Login validation
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
});

// Applicant creation validation
const applicantSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  date_of_birth: Joi.date().max('now').required(),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().pattern(/^[\+\-\(\)\s\d]+$/).max(20).required(),
  address_line_1: Joi.string().max(255).required(),
  address_line_2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(50).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('United States'),
  employment_status: Joi.string().valid('employed', 'self_employed', 'unemployed', 'retired', 'student').required(),
  employer_name: Joi.string().max(255).allow('', null),
  job_title: Joi.string().max(100).allow('', null),
  employment_length_years: Joi.number().min(0).max(50).allow(null),
  annual_income: Joi.number().min(1).required(),
  education_level: Joi.string().valid('high_school', 'associate', 'bachelor', 'master', 'phd', 'other').allow(null),
  existing_debts: Joi.number().min(0).default(0),
  assets_value: Joi.number().min(0).default(0),
  savings_account_balance: Joi.number().min(0).default(0),
  credit_score: Joi.number().min(300).max(850).allow(null),
  credit_history_length_years: Joi.number().min(0).max(40).allow(null),
  number_of_credit_inquiries: Joi.number().min(0).default(0),
  number_of_open_accounts: Joi.number().min(0).default(0),
  payment_history_score: Joi.number().min(0).max(100).allow(null),
  home_ownership: Joi.string().valid('own', 'rent', 'mortgage', 'other').allow(null),
  years_at_current_address: Joi.number().min(0).allow(null),
});

// Loan application validation
const loanApplicationSchema = Joi.object({
  applicant_id: Joi.string().uuid().required(),
  loan_amount: Joi.number().min(1).max(10000000).required(),
  loan_purpose: Joi.string().valid(
    'debt_consolidation',
    'home_improvement',
    'car_purchase',
    'business',
    'medical',
    'vacation',
    'other'
  ).required(),
  loan_term_months: Joi.number().min(1).max(480).required(),
  requested_interest_rate: Joi.number().min(0.0001).max(0.9999).allow(null),
  priority_level: Joi.number().min(1).max(4).default(3),
  applicant_notes: Joi.string().max(5000).allow('', null),
});

// Prediction request validation
const predictionSchema = Joi.object({
  loan_application_id: Joi.string().uuid().required(),
  features: Joi.object({
    InterestRate: Joi.number().required(),
    AnnualIncome: Joi.number().required(),
    Experience: Joi.number().required(),
    LengthOfCreditHistory: Joi.number().required(),
    LoanPurpose: Joi.string().required(),
    LoanAmount: Joi.number().required(),
    HomeOwnershipStatus: Joi.string().required(),
    Age: Joi.number().required(),
    LoanToIncomeRatio: Joi.number().required(),
    ExperienceToAgeRatio: Joi.number().required(),
  }).optional(),  // Made optional - features will be extracted from applicant data
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  loginSchema,
  applicantSchema,
  loanApplicationSchema,
  predictionSchema,
};
