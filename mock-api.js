const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Mock data
const mockPredictions = [
  {
    id: "pred_001",
    applicant_id: "app_001",
    risk_score: 0.65,
    risk_category: "medium",
    confidence: 0.89,
    feature_importance: [
      { feature: "credit_score", importance: 0.35 },
      { feature: "income", importance: 0.25 },
      { feature: "debt_to_income", importance: 0.20 },
      { feature: "employment_length", importance: 0.15 },
      { feature: "loan_amount", importance: 0.05 }
    ],
    recommendation: "review",
    explanation: "Medium risk applicant with good credit score but high debt-to-income ratio.",
    processed_by: "system",
    created_at: "2024-10-08T10:30:00Z",
    updated_at: "2024-10-08T10:30:00Z",
    applicant: {
      id: "app_001",
      personal: {
        first_name: "John",
        last_name: "Doe",
        age: 35,
        email: "john.doe@email.com",
        phone: "+1234567890",
        address: "123 Main St, City, State 12345",
        employment_status: "employed",
        employment_length: 5
      },
      financial: {
        annual_income: 85000,
        monthly_income: 7083.33,
        existing_debt: 25000,
        debt_to_income_ratio: 0.29,
        assets_value: 150000,
        savings_account_balance: 15000
      },
      loan: {
        amount: 50000,
        purpose: "home_improvement",
        term_months: 60
      },
      credit: {
        credit_score: 720,
        credit_history_length: 10,
        number_of_accounts: 8,
        payment_history_score: 85
      }
    }
  }
];

const mockMetrics = {
  total_predictions: 1250,
  approved_count: 563,
  rejected_count: 437,
  pending_count: 250,
  approval_rate: 0.45,
  accuracy: 0.89,
  precision: 0.87,
  recall: 0.91,
  f1_score: 0.89,
  roc_auc: 0.93
};

const mockAnalytics = {
  model_performance: {
    accuracy: 0.89,
    precision: 0.87,
    recall: 0.91,
    f1_score: 0.89,
    roc_auc: 0.93,
    confusion_matrix: {
      true_positives: 423,
      false_positives: 67,
      true_negatives: 398,
      false_negatives: 42
    }
  },
  feature_importance: [
    { feature: "Credit Score", importance: 0.35, description: "Primary credit rating" },
    { feature: "Income", importance: 0.25, description: "Annual income level" },
    { feature: "Debt-to-Income", importance: 0.20, description: "Debt to income ratio" },
    { feature: "Employment Length", importance: 0.15, description: "Years of employment" },
    { feature: "Loan Amount", importance: 0.05, description: "Requested loan amount" }
  ],
  risk_distribution: [
    { risk: "Low", count: 456, percentage: 36.5 },
    { risk: "Medium", count: 587, percentage: 47.0 },
    { risk: "High", count: 207, percentage: 16.5 }
  ],
  trend_data: [
    { date: "2024-10-01", approved: 23, rejected: 18, pending: 5 },
    { date: "2024-10-02", approved: 31, rejected: 22, pending: 8 },
    { date: "2024-10-03", approved: 28, rejected: 19, pending: 6 },
    { date: "2024-10-04", approved: 35, rejected: 25, pending: 10 },
    { date: "2024-10-05", approved: 29, rejected: 21, pending: 7 },
    { date: "2024-10-06", approved: 33, rejected: 24, pending: 9 },
    { date: "2024-10-07", approved: 31, rejected: 20, pending: 8 }
  ]
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Loan Prediction API Mock Server', 
    timestamp: new Date().toISOString() 
  });
});

// Dashboard metrics
app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    success: true,
    data: mockMetrics,
    message: 'Dashboard metrics retrieved successfully'
  });
});

// Single prediction
app.post('/api/predict', (req, res) => {
  const { applicant } = req.body;
  
  // Simulate prediction logic
  const riskScore = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
  const riskCategory = riskScore < 0.4 ? 'low' : riskScore < 0.7 ? 'medium' : 'high';
  const recommendation = riskScore < 0.4 ? 'approve' : riskScore < 0.7 ? 'review' : 'reject';
  
  const prediction = {
    id: `pred_${Date.now()}`,
    applicant_id: `app_${Date.now()}`,
    risk_score: riskScore,
    risk_category: riskCategory,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    feature_importance: mockAnalytics.feature_importance.map(f => ({
      feature: f.feature.toLowerCase().replace(/\s+/g, '_'),
      importance: f.importance + (Math.random() - 0.5) * 0.1
    })),
    recommendation,
    explanation: `${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} risk applicant based on credit profile analysis.`,
    processed_by: "system",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    applicant
  };
  
  setTimeout(() => {
    res.json(prediction);
  }, 1000); // Simulate processing delay
});

// Batch processing
app.post('/api/predict/batch', upload.single('file'), (req, res) => {
  const jobId = `job_${Date.now()}`;
  
  res.json({
    job_id: jobId,
    status: 'processing',
    message: 'Batch job started successfully',
    estimated_completion: new Date(Date.now() + 30000).toISOString()
  });
});

// Batch job status
app.get('/api/batch/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  
  // Simulate job progress
  const progress = Math.min(100, Math.floor(Math.random() * 100));
  const isComplete = progress >= 95;
  
  res.json({
    job_id: jobId,
    status: isComplete ? 'completed' : 'processing',
    progress,
    total_records: 100,
    processed_records: Math.floor(progress),
    successful_predictions: Math.floor(progress * 0.95),
    failed_predictions: Math.floor(progress * 0.05),
    estimated_completion: isComplete ? null : new Date(Date.now() + (100 - progress) * 1000).toISOString(),
    results_url: isComplete ? `/api/batch/${jobId}/results` : null
  });
});

// Batch job results
app.get('/api/batch/:jobId/results', (req, res) => {
  const results = Array.from({ length: 10 }, (_, i) => ({
    ...mockPredictions[0],
    id: `pred_batch_${i + 1}`,
    applicant_id: `app_batch_${i + 1}`,
    risk_score: Math.random() * 0.8 + 0.1,
    applicant: {
      ...mockPredictions[0].applicant,
      id: `app_batch_${i + 1}`,
      personal: {
        ...mockPredictions[0].applicant.personal,
        first_name: `Applicant${i + 1}`,
        last_name: "Test"
      }
    }
  }));
  
  res.json({
    job_id: req.params.jobId,
    total_records: results.length,
    results
  });
});

// Prediction history
app.get('/api/predictions', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  // Generate more mock data
  const allPredictions = Array.from({ length: 50 }, (_, i) => ({
    ...mockPredictions[0],
    id: `pred_${i + 1}`,
    applicant_id: `app_${i + 1}`,
    risk_score: Math.random() * 0.8 + 0.1,
    risk_category: Math.random() < 0.33 ? 'low' : Math.random() < 0.66 ? 'medium' : 'high',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  const paginatedResults = allPredictions.slice(offset, offset + limit);
  
  res.json({
    data: paginatedResults,
    pagination: {
      page,
      limit,
      total: allPredictions.length,
      pages: Math.ceil(allPredictions.length / limit),
      has_next: offset + limit < allPredictions.length,
      has_prev: page > 1
    }
  });
});

// Analytics data
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    data: mockAnalytics,
    message: 'Analytics data retrieved successfully'
  });
});

// Model metrics
app.get('/api/model/metrics', (req, res) => {
  res.json({
    ...mockAnalytics.model_performance,
    last_updated: new Date().toISOString(),
    model_version: "v2.1.0",
    training_date: "2024-10-01T00:00:00Z"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/dashboard/metrics`);
  console.log(`   POST /api/predict`);
  console.log(`   POST /api/predict/batch`);
  console.log(`   GET  /api/batch/:jobId/status`);
  console.log(`   GET  /api/predictions`);
  console.log(`   GET  /api/analytics`);
  console.log(`   GET  /api/model/metrics`);
});