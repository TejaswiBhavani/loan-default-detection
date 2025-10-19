/**
 * Validation Test Suite
 * Tests for schema validation, sanitization, and business rules
 */

const Joi = require('joi');
const {
  applicantCreateSchema,
  loanApplicationCreateSchema,
  predictionCreateSchema,
  loginSchema
} = require('../middleware/validation.enhanced');

const {
  sanitizeText,
  normalizeEmail,
  normalizePhone,
  sanitizeCurrency,
  sanitizeApplicantData,
  sanitizeLoanData
} = require('../utils/sanitization');

const {
  validateDebtToIncome,
  validateLoanToIncome,
  validateEmploymentIncome,
  validateCreditProfile,
  validateLoanTerm,
  validateAge,
  validateLoanApplication
} = require('../utils/businessRules');

// ============================================================================
// TEST DATA
// ============================================================================

const validApplicant = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1985-05-15',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  address_line_1: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94102',
  employment_status: 'employed',
  employer_name: 'Tech Corp',
  annual_income: 75000,
  existing_debts: 15000,
  debt_to_income_ratio: 0.2,
  credit_score: 720
};

const invalidApplicant = {
  first_name: '',
  last_name: 'D',
  date_of_birth: '2030-01-01',
  email: 'invalid-email',
  phone: '123',
  state: 'California',
  zip_code: 'ABC',
  employment_status: 'working',
  annual_income: -1000,
  credit_score: 1000
};

const validLoanApplication = {
  applicant_id: '123e4567-e89b-12d3-a456-426614174000',
  loan_amount: 25000,
  loan_purpose: 'debt_consolidation',
  loan_term_months: 48,
  requested_interest_rate: 0.0749,
  priority_level: 2
};

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

function testSchemaValidation() {
  console.log('\n=== SCHEMA VALIDATION TESTS ===\n');
  
  // Test 1: Valid applicant
  console.log('Test 1: Valid applicant data');
  const test1 = applicantCreateSchema.validate(validApplicant, { abortEarly: false });
  if (test1.error) {
    console.log('❌ FAILED - Expected no errors');
    test1.error.details.forEach(d => console.log(`   ${d.message}`));
  } else {
    console.log('✅ PASSED - No validation errors');
  }
  
  // Test 2: Invalid applicant
  console.log('\nTest 2: Invalid applicant data (should have multiple errors)');
  const test2 = applicantCreateSchema.validate(invalidApplicant, { abortEarly: false });
  if (test2.error) {
    console.log(`✅ PASSED - Found ${test2.error.details.length} validation errors:`);
    test2.error.details.forEach(d => console.log(`   - ${d.path.join('.')}: ${d.message}`));
  } else {
    console.log('❌ FAILED - Expected validation errors');
  }
  
  // Test 3: Credit score boundaries
  console.log('\nTest 3: Credit score boundaries');
  const test3a = applicantCreateSchema.validate({
    ...validApplicant,
    credit_score: 299
  }, { abortEarly: false });
  console.log(test3a.error ? '✅ PASSED - Rejected credit score 299' : '❌ FAILED - Should reject < 300');
  
  const test3b = applicantCreateSchema.validate({
    ...validApplicant,
    credit_score: 851
  }, { abortEarly: false });
  console.log(test3b.error ? '✅ PASSED - Rejected credit score 851' : '❌ FAILED - Should reject > 850');
  
  const test3c = applicantCreateSchema.validate({
    ...validApplicant,
    credit_score: 720
  }, { abortEarly: false });
  console.log(!test3c.error ? '✅ PASSED - Accepted credit score 720' : '❌ FAILED - Should accept valid score');
  
  // Test 4: Email validation
  console.log('\nTest 4: Email validation');
  const test4a = applicantCreateSchema.validate({
    ...validApplicant,
    email: 'invalid.email'
  }, { abortEarly: false });
  console.log(test4a.error ? '✅ PASSED - Rejected invalid email' : '❌ FAILED - Should reject invalid email');
  
  const test4b = applicantCreateSchema.validate({
    ...validApplicant,
    email: 'VALID@EXAMPLE.COM'
  }, { abortEarly: false });
  console.log(!test4b.error ? '✅ PASSED - Accepted valid email (uppercase)' : '❌ FAILED - Should accept valid email');
  console.log(`   Normalized to: ${test4b.value?.email}`);
  
  // Test 5: Loan application validation
  console.log('\nTest 5: Loan application validation');
  const test5 = loanApplicationCreateSchema.validate(validLoanApplication, { abortEarly: false });
  if (test5.error) {
    console.log('❌ FAILED - Expected no errors');
    test5.error.details.forEach(d => console.log(`   ${d.message}`));
  } else {
    console.log('✅ PASSED - Valid loan application accepted');
  }
  
  // Test 6: Loan term validation (must be standard term)
  console.log('\nTest 6: Loan term validation');
  const test6a = loanApplicationCreateSchema.validate({
    ...validLoanApplication,
    loan_term_months: 47 // Not a standard term
  }, { abortEarly: false });
  console.log(test6a.error ? '✅ PASSED - Rejected non-standard term (47)' : '❌ FAILED - Should reject non-standard terms');
  
  const test6b = loanApplicationCreateSchema.validate({
    ...validLoanApplication,
    loan_term_months: 48 // Standard term
  }, { abortEarly: false });
  console.log(!test6b.error ? '✅ PASSED - Accepted standard term (48)' : '❌ FAILED - Should accept standard terms');
}

// ============================================================================
// SANITIZATION TESTS
// ============================================================================

function testSanitization() {
  console.log('\n\n=== SANITIZATION TESTS ===\n');
  
  // Test 1: Text sanitization
  console.log('Test 1: Text sanitization');
  const dirtyText = '  <script>alert("XSS")</script>  Multiple   Spaces  ';
  const cleanText = sanitizeText(dirtyText);
  console.log(`Input:  "${dirtyText}"`);
  console.log(`Output: "${cleanText}"`);
  console.log(cleanText.includes('<script>') ? '❌ FAILED - HTML not escaped' : '✅ PASSED - HTML escaped');
  console.log(cleanText.includes('  ') ? '❌ FAILED - Multiple spaces not normalized' : '✅ PASSED - Spaces normalized');
  
  // Test 2: Email normalization
  console.log('\nTest 2: Email normalization');
  const email = 'JOHN.DOE@EXAMPLE.COM';
  const normalized = normalizeEmail(email);
  console.log(`Input:  ${email}`);
  console.log(`Output: ${normalized}`);
  console.log(normalized === normalized.toLowerCase() ? '✅ PASSED - Converted to lowercase' : '❌ FAILED - Should be lowercase');
  
  // Test 3: Phone normalization
  console.log('\nTest 3: Phone normalization');
  const phone1 = '(555) 123-4567';
  const phone2 = '5551234567';
  console.log(`Input:  "${phone1}" -> Output: "${normalizePhone(phone1)}"`);
  console.log(`Input:  "${phone2}" -> Output: "${normalizePhone(phone2)}"`);
  console.log(normalizePhone(phone2).startsWith('+1') ? '✅ PASSED - Added +1 prefix' : '❌ FAILED - Should add +1');
  
  // Test 4: Currency sanitization
  console.log('\nTest 4: Currency sanitization');
  console.log(`Input: 123.456 -> Output: ${sanitizeCurrency(123.456)}`);
  console.log(`Input: -100 -> Output: ${sanitizeCurrency(-100)}`);
  console.log(`Input: 1000000000 (max 10M) -> Output: ${sanitizeCurrency(1000000000, 10000000)}`);
  console.log(sanitizeCurrency(123.456) === 123.46 ? '✅ PASSED - Rounded to 2 decimals' : '❌ FAILED - Should round to 2 decimals');
  console.log(sanitizeCurrency(-100) === null ? '✅ PASSED - Rejected negative' : '❌ FAILED - Should reject negative');
  console.log(sanitizeCurrency(1000000000, 10000000) === null ? '✅ PASSED - Rejected exceeds max' : '❌ FAILED - Should reject > max');
  
  // Test 5: Full applicant sanitization
  console.log('\nTest 5: Full applicant data sanitization');
  const dirtyApplicant = {
    first_name: '  <b>John</b>  ',
    last_name: 'Doe<script>',
    email: 'JOHN@EXAMPLE.COM',
    phone: '5551234567',
    annual_income: 75000.50,
    existing_debts: 15000.999
  };
  const cleanApplicant = sanitizeApplicantData(dirtyApplicant);
  console.log('First name:', cleanApplicant.first_name);
  console.log('Email:', cleanApplicant.email);
  console.log('Phone:', cleanApplicant.phone);
  console.log('Annual income:', cleanApplicant.annual_income);
  console.log('Existing debts:', cleanApplicant.existing_debts);
  console.log(!cleanApplicant.first_name.includes('<b>') ? '✅ PASSED - HTML removed from name' : '❌ FAILED - Should remove HTML');
  console.log(cleanApplicant.annual_income === 75000.50 ? '✅ PASSED - Currency precision correct' : '❌ FAILED - Currency precision wrong');
  console.log(cleanApplicant.existing_debts === 15001.00 ? '✅ PASSED - Currency rounded' : '❌ FAILED - Currency should round');
}

// ============================================================================
// BUSINESS RULES TESTS
// ============================================================================

function testBusinessRules() {
  console.log('\n\n=== BUSINESS RULES TESTS ===\n');
  
  // Test 1: Debt-to-income validation
  console.log('Test 1: Debt-to-income ratio validation');
  const test1a = validateDebtToIncome({
    annual_income: 100000,
    existing_debts: 43000,
    debt_to_income_ratio: 0.43
  });
  console.log(`DTI = 0.43 (at threshold): ${test1a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Warnings: ${test1a.warnings.length} | Errors: ${test1a.errors.length}`);
  
  const test1b = validateDebtToIncome({
    annual_income: 100000,
    existing_debts: 51000,
    debt_to_income_ratio: 0.51
  });
  console.log(`DTI = 0.51 (exceeds max): ${test1b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  console.log(`  Errors: ${test1b.errors.join(', ')}`);
  
  // Test 2: Loan-to-income validation
  console.log('\nTest 2: Loan-to-income ratio validation');
  const test2a = validateLoanToIncome(
    { loan_amount: 200000, loan_purpose: 'car_purchase' },
    { annual_income: 100000 }
  );
  console.log(`LTI = 2.0 for car purchase: ${test2a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  const test2b = validateLoanToIncome(
    { loan_amount: 350000, loan_purpose: 'vacation' },
    { annual_income: 100000 }
  );
  console.log(`LTI = 3.5 for vacation (unsecured): ${test2b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  console.log(`  Errors: ${test2b.errors.join(', ')}`);
  
  // Test 3: Employment-income consistency
  console.log('\nTest 3: Employment-income consistency');
  const test3a = validateEmploymentIncome({
    employment_status: 'employed',
    employer_name: 'Tech Corp',
    annual_income: 75000,
    monthly_income: 6250
  });
  console.log(`Employed with employer: ${test3a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  const test3b = validateEmploymentIncome({
    employment_status: 'employed',
    employer_name: '',
    annual_income: 75000
  });
  console.log(`Employed without employer: ${test3b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  
  // Test 4: Credit profile validation
  console.log('\nTest 4: Credit profile validation');
  const test4a = validateCreditProfile({
    credit_score: 720,
    credit_history_length_years: 8,
    number_of_credit_inquiries: 2,
    date_of_birth: '1985-05-15'
  });
  console.log(`Good credit profile: ${test4a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  const test4b = validateCreditProfile({
    credit_score: 550,
    number_of_credit_inquiries: 15,
    date_of_birth: '1985-05-15'
  });
  console.log(`Poor credit profile: ${test4b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  console.log(`  Warnings: ${test4b.warnings.length} | Errors: ${test4b.errors.length}`);
  
  // Test 5: Loan term appropriateness
  console.log('\nTest 5: Loan term appropriateness');
  const test5a = validateLoanTerm({
    loan_amount: 25000,
    loan_term_months: 60,
    loan_purpose: 'car_purchase'
  });
  console.log(`60 months for car purchase: ${test5a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  const test5b = validateLoanTerm({
    loan_amount: 5000,
    loan_term_months: 480,
    loan_purpose: 'vacation'
  });
  console.log(`480 months for vacation: ${test5b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  
  // Test 6: Age validation
  console.log('\nTest 6: Age validation');
  const test6a = validateAge({
    date_of_birth: '1985-05-15'
  });
  console.log(`Age ~39: ${test6a.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  const test6b = validateAge({
    date_of_birth: '2010-01-01'
  });
  console.log(`Age ~15 (under 18): ${test6b.isValid ? '❌ Should be invalid' : '✅ Invalid as expected'}`);
  
  // Test 7: Comprehensive loan application validation
  console.log('\nTest 7: Comprehensive loan application validation');
  const loanData = {
    loan_amount: 25000,
    loan_purpose: 'debt_consolidation',
    loan_term_months: 48
  };
  const applicantData = {
    annual_income: 75000,
    existing_debts: 15000,
    employment_status: 'employed',
    employer_name: 'Tech Corp',
    credit_score: 720,
    date_of_birth: '1985-05-15'
  };
  const test7 = validateLoanApplication(loanData, applicantData);
  console.log(`Full validation: ${test7.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Warnings: ${test7.warnings.length} | Errors: ${test7.errors.length}`);
  if (test7.warnings.length > 0) {
    console.log('  Warnings:');
    test7.warnings.forEach(w => console.log(`    - ${w}`));
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  VALIDATION TEST SUITE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  try {
    testSchemaValidation();
    testSanitization();
    testBusinessRules();
    
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    TESTS COMPLETED                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(error);
  }
}

// Export for use in other test files
module.exports = {
  runAllTests,
  testSchemaValidation,
  testSanitization,
  testBusinessRules,
  validApplicant,
  invalidApplicant,
  validLoanApplication
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}
