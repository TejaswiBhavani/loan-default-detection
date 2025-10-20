import React, { useState } from 'react';
import {
  UserIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import Toast from '../components/common/Toast';

interface FormData {
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;

  // Employment & Income
  employment_status: string;
  employer_name: string;
  job_title: string;
  employment_length_years: number;
  annual_income: number;
  
  // Financial Information
  existing_debts: number;
  assets_value: number;
  savings_account_balance: number;
  home_ownership: string;
  years_at_current_address: number;

  // Credit Information
  credit_score: number;
  credit_history_length_years: number;
  number_of_credit_inquiries: number;
  number_of_open_accounts: number;
  payment_history_score: number;

  // Loan Details
  loan_amount: number;
  loan_purpose: string;
  loan_term_months: number;
  requested_interest_rate: number;
}

interface PredictionResult {
  risk_score: number;
  risk_category: 'low' | 'medium' | 'high';
  confidence: number;
  recommendation: 'approve' | 'review' | 'reject';
  created_at: string;
}

const SingleAssessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    employment_status: 'employed',
    employer_name: '',
    job_title: '',
    employment_length_years: 0,
    annual_income: 0,
    existing_debts: 0,
    assets_value: 0,
    savings_account_balance: 0,
    home_ownership: 'rent',
    years_at_current_address: 0,
    credit_score: 650,
    credit_history_length_years: 0,
    number_of_credit_inquiries: 0,
    number_of_open_accounts: 0,
    payment_history_score: 50,
    loan_amount: 10000,
    loan_purpose: 'debt_consolidation',
    loan_term_months: 36,
    requested_interest_rate: 0.08,
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Info
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
          showToast('error', 'Please fill in all required personal information fields');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          showToast('error', 'Please enter a valid email address');
          return false;
        }
        break;
      case 2: // Employment
        if (formData.annual_income <= 0) {
          showToast('error', 'Annual income must be greater than 0');
          return false;
        }
        break;
      case 3: // Credit
        if (formData.credit_score < 300 || formData.credit_score > 850) {
          showToast('error', 'Credit score must be between 300 and 850');
          return false;
        }
        break;
      case 4: // Loan Details
        if (formData.loan_amount <= 0) {
          showToast('error', 'Loan amount must be greater than 0');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      // Step 1: Create applicant
      // Ensure date_of_birth is properly formatted
      const dobValue = formData.date_of_birth || 
        new Date(new Date().getFullYear() - 30, 0, 1).toISOString().split('T')[0];
      
      const applicantResponse = await apiService.createApplicant({
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: dobValue,
        email: formData.email,
        phone: formData.phone,
        address_line_1: formData.address_line_1 || '123 Main St',
        address_line_2: formData.address_line_2 || '',
        city: formData.city || 'New York',
        state: formData.state || 'NY',
        zip_code: formData.zip_code || '10001',
        country: formData.country || 'United States',
        employment_status: formData.employment_status || 'employed',
        employer_name: formData.employer_name || '',
        job_title: formData.job_title || '',
        employment_length_years: formData.employment_length_years || 0,
        annual_income: formData.annual_income,
        existing_debts: formData.existing_debts || 0,
        assets_value: formData.assets_value || 0,
        savings_account_balance: formData.savings_account_balance || 0,
        credit_score: formData.credit_score || 650,
        credit_history_length_years: formData.credit_history_length_years || 0,
        number_of_credit_inquiries: formData.number_of_credit_inquiries || 0,
        number_of_open_accounts: formData.number_of_open_accounts || 0,
        payment_history_score: formData.payment_history_score || 50,
        home_ownership: formData.home_ownership || 'rent',
        years_at_current_address: formData.years_at_current_address || 0,
      });

      if (!applicantResponse.success || !applicantResponse.data) {
        throw new Error('Failed to create applicant');
      }

      const applicantId = applicantResponse.data.id;

      // Step 2: Create loan application
      const loanAppResponse = await apiService.createLoanApplication({
        applicant_id: applicantId,
        loan_amount: formData.loan_amount,
        loan_purpose: formData.loan_purpose,
        loan_term_months: formData.loan_term_months,
        requested_interest_rate: formData.requested_interest_rate,
      });

      if (!loanAppResponse.success || !loanAppResponse.data) {
        throw new Error('Failed to create loan application');
      }

      const loanApplicationId = loanAppResponse.data.id;

      // Step 3: Get prediction
      const predictionResponse = await apiService.predictSingle({
        loan_application_id: loanApplicationId,
      });

      if (predictionResponse.success && predictionResponse.data) {
        const predData = predictionResponse.data as any;
        setPrediction({
          risk_score: predData.risk_score || 0,
          risk_category: predData.risk_category || 'medium',
          confidence: predData.confidence_score || predData.confidence || 0,
          recommendation: predData.recommendation || 'review',
          created_at: predData.created_at || new Date().toISOString(),
        });
        showToast('success', 'Risk assessment completed successfully!');
        setCurrentStep(5); // Move to results step
      } else {
        throw new Error('Failed to get prediction');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to complete assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setPrediction(null);
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      email: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States',
      employment_status: 'employed',
      employer_name: '',
      job_title: '',
      employment_length_years: 0,
      annual_income: 0,
      existing_debts: 0,
      assets_value: 0,
      savings_account_balance: 0,
      home_ownership: 'rent',
      years_at_current_address: 0,
      credit_score: 650,
      credit_history_length_years: 0,
      number_of_credit_inquiries: 0,
      number_of_open_accounts: 0,
      payment_history_score: 50,
      loan_amount: 10000,
      loan_purpose: 'debt_consolidation',
      loan_term_months: 36,
      requested_interest_rate: 0.08,
    });
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, name: 'Personal', icon: UserIcon },
      { number: 2, name: 'Employment', icon: BanknotesIcon },
      { number: 3, name: 'Credit', icon: ChartBarIcon },
      { number: 4, name: 'Loan Details', icon: BanknotesIcon },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-xs mt-2 font-medium">{step.name}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Home Ownership</label>
          <select
            name="home_ownership"
            value={formData.home_ownership}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="own">Own</option>
            <option value="rent">Rent</option>
            <option value="mortgage">Mortgage</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address_line_1"
            value={formData.address_line_1}
            onChange={handleInputChange}
            placeholder="Street address"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="e.g., NY, CA"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  const renderEmploymentInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment & Income</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Status <span className="text-red-500">*</span>
          </label>
          <select
            name="employment_status"
            value={formData.employment_status}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="employed">Employed</option>
            <option value="self_employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="retired">Retired</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Length (years)
          </label>
          <input
            type="number"
            name="employment_length_years"
            value={formData.employment_length_years}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
          <input
            type="text"
            name="employer_name"
            value={formData.employer_name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            name="job_title"
            value={formData.job_title}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Annual Income <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="annual_income"
            value={formData.annual_income}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Existing Debts</label>
          <input
            type="number"
            name="existing_debts"
            value={formData.existing_debts}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assets Value</label>
          <input
            type="number"
            name="assets_value"
            value={formData.assets_value}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Savings Account Balance
          </label>
          <input
            type="number"
            name="savings_account_balance"
            value={formData.savings_account_balance}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  const renderCreditInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credit Score (300-850) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="credit_score"
            value={formData.credit_score}
            onChange={handleInputChange}
            min="300"
            max="850"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  formData.credit_score >= 700
                    ? 'bg-green-500'
                    : formData.credit_score >= 600
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${((formData.credit_score - 300) / 550) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credit History Length (years)
          </label>
          <input
            type="number"
            name="credit_history_length_years"
            value={formData.credit_history_length_years}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Credit Inquiries
          </label>
          <input
            type="number"
            name="number_of_credit_inquiries"
            value={formData.number_of_credit_inquiries}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Open Accounts
          </label>
          <input
            type="number"
            name="number_of_open_accounts"
            value={formData.number_of_open_accounts}
            onChange={handleInputChange}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment History Score (0-100)
          </label>
          <input
            type="range"
            name="payment_history_score"
            value={formData.payment_history_score}
            onChange={handleInputChange}
            min="0"
            max="100"
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Poor (0)</span>
            <span className="font-medium">{formData.payment_history_score}</span>
            <span>Excellent (100)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoanDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Request Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loan Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="loan_amount"
            value={formData.loan_amount}
            onChange={handleInputChange}
            min="1"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loan Purpose <span className="text-red-500">*</span>
          </label>
          <select
            name="loan_purpose"
            value={formData.loan_purpose}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="debt_consolidation">Debt Consolidation</option>
            <option value="home_improvement">Home Improvement</option>
            <option value="car_purchase">Car Purchase</option>
            <option value="business">Business</option>
            <option value="medical">Medical</option>
            <option value="vacation">Vacation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loan Term (months) <span className="text-red-500">*</span>
          </label>
          <select
            name="loan_term_months"
            value={formData.loan_term_months}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="48">48 months</option>
            <option value="60">60 months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requested Interest Rate
          </label>
          <input
            type="number"
            name="requested_interest_rate"
            value={formData.requested_interest_rate}
            onChange={handleInputChange}
            min="0"
            max="1"
            step="0.001"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.requested_interest_rate * 100).toFixed(2)}% APR
          </p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Loan Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-blue-700">Loan Amount:</div>
          <div className="font-medium">${formData.loan_amount.toLocaleString()}</div>
          <div className="text-blue-700">Monthly Payment (est):</div>
          <div className="font-medium">
            ${(
              (formData.loan_amount *
                (formData.requested_interest_rate / 12) *
                Math.pow(1 + formData.requested_interest_rate / 12, formData.loan_term_months)) /
              (Math.pow(1 + formData.requested_interest_rate / 12, formData.loan_term_months) - 1)
            ).toFixed(2)}
          </div>
          <div className="text-blue-700">Debt-to-Income Ratio:</div>
          <div className="font-medium">
            {formData.annual_income > 0
              ? ((formData.existing_debts / formData.annual_income) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!prediction) return null;

    const getRecommendationIcon = () => {
      switch (prediction.recommendation) {
        case 'approve':
          return <CheckCircleIcon className="w-16 h-16 text-green-500" />;
        case 'review':
          return <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500" />;
        case 'reject':
          return <XCircleIcon className="w-16 h-16 text-red-500" />;
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">{getRecommendationIcon()}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h3>
          <p className="text-gray-600">
            Risk analysis completed for {formData.first_name} {formData.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 mb-2">Risk Score</div>
            <div className="text-3xl font-bold text-gray-900">
              {(prediction.risk_score * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 mb-2">Risk Category</div>
            <div className="flex justify-center">
              <RiskBadge risk={prediction.risk_category} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 mb-2">Confidence</div>
            <div className="text-3xl font-bold text-gray-900">
              {(prediction.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Recommendation</h4>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {prediction.recommendation === 'approve' && (
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1" />
              )}
              {prediction.recommendation === 'review' && (
                <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1" />
              )}
              {prediction.recommendation === 'reject' && (
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 capitalize">
                {prediction.recommendation}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {prediction.recommendation === 'approve' &&
                  'This application shows low risk characteristics and can be approved with standard terms.'}
                {prediction.recommendation === 'review' &&
                  'This application requires manual review. Consider additional verification or adjusted terms.'}
                {prediction.recommendation === 'reject' &&
                  'This application shows high risk characteristics and should be declined.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            New Assessment
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={hideToast} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Single Assessment</h1>
        <p className="text-gray-600">Evaluate individual loan applicant risk</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {currentStep <= 4 && renderStepIndicator()}

        {loading ? (
          <div className="py-12">
            <LoadingSpinner />
            <p className="text-center text-gray-600 mt-4">Processing assessment...</p>
          </div>
        ) : (
          <>
            {currentStep === 1 && renderPersonalInfo()}
            {currentStep === 2 && renderEmploymentInfo()}
            {currentStep === 3 && renderCreditInfo()}
            {currentStep === 4 && renderLoanDetails()}
            {currentStep === 5 && renderResults()}

            {currentStep <= 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    Submit & Get Risk Assessment
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SingleAssessment;
