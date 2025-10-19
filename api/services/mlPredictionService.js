/**
 * ML Prediction Service
 * Handles communication with Python ML service and provides fallback mechanisms
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class MLPredictionService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.timeout = parseInt(process.env.PREDICTION_TIMEOUT) || 30000;
    this.fallbackEnabled = process.env.ML_FALLBACK_ENABLED !== 'false';
    this.pythonProcess = null;
    this.modelVersion = 'v2.1.3_20251006';
  }

  /**
   * Start Python ML service as a child process
   */
  async startMLService() {
    if (this.pythonProcess) {
      console.log('⚠️ ML service already running');
      return;
    }

    return new Promise((resolve, reject) => {
      const pythonPath = process.env.PYTHON_PATH || 'python3';
      const servicePath = path.join(__dirname, 'ml_service.py');

      console.log('🚀 Starting ML service...');
      console.log(`   Python: ${pythonPath}`);
      console.log(`   Script: ${servicePath}`);

      this.pythonProcess = spawn(pythonPath, [servicePath], {
        env: { ...process.env, ML_SERVICE_PORT: '5001' },
        cwd: __dirname,
      });

      this.pythonProcess.stdout.on('data', (data) => {
        console.log(`[ML Service] ${data.toString().trim()}`);
        if (data.toString().includes('ready to accept requests')) {
          resolve();
        }
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`[ML Service Error] ${data.toString().trim()}`);
      });

      this.pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start ML service:', error);
        reject(error);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`ML service exited with code ${code}`);
        this.pythonProcess = null;
      });

      // Timeout for startup
      setTimeout(() => {
        if (!this.pythonProcess) {
          reject(new Error('ML service startup timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Stop Python ML service
   */
  stopMLService() {
    if (this.pythonProcess) {
      console.log('🛑 Stopping ML service...');
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }

  /**
   * Check if ML service is healthy
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('ML service health check failed:', error.message);
      return null;
    }
  }

  /**
   * Make prediction using ML service
   */
  async predict(applicantData) {
    try {
      console.log('📊 Making ML prediction...');

      const response = await axios.post(
        `${this.mlServiceUrl}/predict`,
        applicantData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        console.log(`✓ Prediction successful: risk=${response.data.data.risk_score.toFixed(3)}`);
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('ML prediction error:', error.message);

      // Try fallback if enabled
      if (this.fallbackEnabled) {
        console.log('⚠️ Using fallback prediction method...');
        return this.fallbackPredict(applicantData);
      }

      throw error;
    }
  }

  /**
   * Fallback prediction method using simple rules
   * Used when ML service is unavailable
   */
  fallbackPredict(applicantData) {
    console.log('🔄 Executing fallback prediction...');

    try {
      const personal = applicantData.personal_info || applicantData.personalInfo || {};
      const financial = applicantData.financial_info || applicantData.financialInfo || {};
      const credit = applicantData.credit_info || applicantData.creditInfo || {};

      // Extract key metrics
      const age = personal.age || 35;
      const income = personal.income || 50000;
      const loanAmount = financial.loan_amount || 25000;
      const creditScore = credit.credit_score || 650;
      const employmentLength = personal.employment_length || 5;
      const creditHistory = credit.credit_history_length || 5;

      // Calculate risk factors
      const loanToIncome = loanAmount / income;
      const creditRisk = (850 - creditScore) / 550; // Normalize credit score to 0-1
      const ageRisk = age < 25 ? 0.3 : (age > 60 ? 0.2 : 0.1);
      const employmentRisk = employmentLength < 2 ? 0.3 : (employmentLength < 5 ? 0.15 : 0.05);
      const historyRisk = creditHistory < 3 ? 0.2 : (creditHistory < 7 ? 0.1 : 0.05);

      // Calculate overall risk score (weighted average)
      let riskScore = 
        (loanToIncome * 0.30) +
        (creditRisk * 0.35) +
        (ageRisk * 0.10) +
        (employmentRisk * 0.15) +
        (historyRisk * 0.10);

      // Clamp between 0 and 1
      riskScore = Math.max(0, Math.min(1, riskScore));

      // Determine risk category
      let riskCategory;
      if (riskScore < 0.3) {
        riskCategory = 'low';
      } else if (riskScore < 0.7) {
        riskCategory = 'medium';
      } else {
        riskCategory = 'high';
      }

      // Calculate confidence (lower for fallback)
      const confidenceScore = 0.65; // Fallback predictions have lower confidence

      // Generate feature importance
      const featureImportance = [
        {
          feature: 'credit_score',
          importance: 0.35,
          impact: creditScore < 650 ? 'positive' : 'negative',
          value: creditScore,
          display_name: 'Credit Score',
        },
        {
          feature: 'loan_to_income_ratio',
          importance: 0.30,
          impact: loanToIncome > 0.5 ? 'positive' : 'negative',
          value: loanToIncome.toFixed(3),
          display_name: 'Loan-to-Income Ratio',
        },
        {
          feature: 'income',
          importance: 0.15,
          impact: income < 50000 ? 'positive' : 'negative',
          value: income,
          display_name: 'Annual Income',
        },
        {
          feature: 'employment_length',
          importance: 0.10,
          impact: employmentLength < 5 ? 'positive' : 'negative',
          value: employmentLength,
          display_name: 'Employment Length',
        },
        {
          feature: 'age',
          importance: 0.10,
          impact: age < 25 || age > 60 ? 'positive' : 'negative',
          value: age,
          display_name: 'Age',
        },
      ];

      return {
        risk_score: parseFloat(riskScore.toFixed(4)),
        risk_category: riskCategory,
        confidence_score: confidenceScore,
        prediction: riskScore >= 0.5 ? 1 : 0,
        prediction_label: riskScore >= 0.5 ? 'default' : 'no_default',
        feature_importance: featureImportance,
        model_version: this.modelVersion + '_fallback',
        fallback: true,
      };
    } catch (error) {
      console.error('Fallback prediction error:', error);
      throw new Error('Both ML service and fallback prediction failed');
    }
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/model/info`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error.message);
      return {
        success: false,
        data: {
          version: this.modelVersion,
          status: 'unavailable',
          fallback_enabled: this.fallbackEnabled,
        },
      };
    }
  }

  /**
   * Reload model (admin function)
   */
  async reloadModel() {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/model/reload`, null, {
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Model reload failed:', error.message);
      throw error;
    }
  }

  /**
   * Transform backend applicant data to ML service format
   * This ensures consistent data structure
   */
  transformApplicantData(applicant) {
    // ML service now handles flat data format directly
    return {
      age: applicant.age || 35,
      annual_income: parseFloat(applicant.annual_income) || 50000,
      employment_status: applicant.employment_status || 'employed',
      employment_length_years: parseFloat(applicant.employment_length_years) || 5,
      education_level: applicant.education_level || 'bachelor',
      loan_amount: parseFloat(applicant.loan_amount) || 25000,
      loan_purpose: applicant.loan_purpose || 'debt_consolidation',
      loan_term_months: parseInt(applicant.loan_term_months) || 60,
      existing_debts: parseFloat(applicant.existing_debts) || 0,
      assets_value: parseFloat(applicant.assets_value) || 0,
      debt_to_income_ratio: parseFloat(applicant.debt_to_income_ratio) || 0,
      credit_score: parseInt(applicant.credit_score) || 650,
      credit_history_length_years: parseFloat(applicant.credit_history_length_years) || 5,
      number_of_credit_inquiries: parseInt(applicant.number_of_credit_inquiries) || 0,
      number_of_open_accounts: parseInt(applicant.number_of_open_accounts) || 0,
      payment_history_score: parseFloat(applicant.payment_history_score) || 75,
      home_ownership: applicant.home_ownership || 'mortgage',
    };
  }
}

// Create singleton instance
const mlPredictionService = new MLPredictionService();

module.exports = mlPredictionService;
