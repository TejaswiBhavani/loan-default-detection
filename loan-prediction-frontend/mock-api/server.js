const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Mock data generators
const generateMockPrediction = (applicantData = null) => ({
  id: Math.random().toString(36).substr(2, 9),
  applicant_id: applicantData?.id || Math.random().toString(36).substr(2, 9),
  risk_score: Math.random(),
  risk_category: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
  confidence: 0.7 + Math.random() * 0.3,
  feature_importance: [
    { feature: 'annual_income', importance: Math.random() * 0.3, impact: 'positive', display_name: 'Annual Income' },
    { feature: 'debt_to_income', importance: Math.random() * 0.25, impact: 'negative', display_name: 'Debt to Income' },
    { feature: 'credit_score', importance: Math.random() * 0.2, impact: 'positive', display_name: 'Credit Score' },
    { feature: 'employment_length', importance: Math.random() * 0.15, impact: 'positive', display_name: 'Employment Length' },
    { feature: 'loan_amount', importance: Math.random() * 0.1, impact: 'negative', display_name: 'Loan Amount' }
  ],
  explanation: 'Based on the applicant\'s financial profile, this prediction considers multiple risk factors.',
  recommendation: ['approve', 'review', 'reject'][Math.floor(Math.random() * 3)],
  processed_by: 'system',
  processed_at: new Date().toISOString(),
  model_version: 'v2.1.3'
});

const generateMockMetrics = () => ({
  accuracy: 0.94 + Math.random() * 0.05,
  precision: 0.91 + Math.random() * 0.08,
  recall: 0.89 + Math.random() * 0.1,
  f1_score: 0.92 + Math.random() * 0.07,
  auc_roc: 0.96 + Math.random() * 0.03,
  confusion_matrix: {
    true_positives: Math.floor(Math.random() * 100) + 450,
    false_positives: Math.floor(Math.random() * 50) + 20,
    true_negatives: Math.floor(Math.random() * 200) + 800,
    false_negatives: Math.floor(Math.random() * 30) + 15
  },
  feature_importance: [
    { feature: 'annual_income', importance: 0.24, impact: 'positive', display_name: 'Annual Income' },
    { feature: 'debt_to_income', importance: 0.19, impact: 'negative', display_name: 'Debt to Income' },
    { feature: 'credit_score', importance: 0.16, impact: 'positive', display_name: 'Credit Score' },
    { feature: 'employment_length', importance: 0.13, impact: 'positive', display_name: 'Employment Length' },
    { feature: 'loan_amount', importance: 0.11, impact: 'negative', display_name: 'Loan Amount' },
    { feature: 'home_ownership', importance: 0.08, impact: 'neutral', display_name: 'Home Ownership' },
    { feature: 'loan_purpose', importance: 0.05, impact: 'neutral', display_name: 'Loan Purpose' },
    { feature: 'payment_history_score', importance: 0.04, impact: 'positive', display_name: 'Payment History' }
  ],
  model_version: 'v2.1.3',
  last_updated: new Date().toISOString()
});

const generateDashboardMetrics = () => ({
  total_predictions_today: Math.floor(Math.random() * 100) + 150,
  approval_rate_today: 0.6 + Math.random() * 0.2,
  approval_rate_week: 0.65 + Math.random() * 0.15,
  average_risk_score: 0.3 + Math.random() * 0.2,
  high_risk_applications: Math.floor(Math.random() * 30) + 15,
  pending_reviews: Math.floor(Math.random() * 20) + 5,
  system_accuracy: 0.93 + Math.random() * 0.05,
  recent_predictions: Array.from({ length: 5 }, () => generateMockPrediction())
});

// In-memory storage for batch jobs
const batchJobs = new Map();

// API Routes

// Single prediction
app.post('/api/predict', (req, res) => {
  console.log('Single prediction request:', req.body);
  
  // Simulate processing delay
  setTimeout(() => {
    const prediction = generateMockPrediction(req.body.applicant);
    res.json({
      success: true,
      prediction,
      processing_time_ms: Math.floor(Math.random() * 500) + 100
    });
  }, 500 + Math.random() * 1000);
});

// Batch prediction upload
app.post('/api/predict/batch', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  const jobId = Math.random().toString(36).substr(2, 9);
  const job = {
    id: jobId,
    filename: req.file.originalname,
    status: 'processing',
    total_records: 0,
    processed_records: 0,
    predictions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    error: null
  };

  batchJobs.set(jobId, job);

  // Process CSV file
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      job.total_records = results.length;
      
      // Simulate batch processing
      let processed = 0;
      const processInterval = setInterval(() => {
        if (processed >= results.length) {
          clearInterval(processInterval);
          job.status = 'completed';
          job.updated_at = new Date().toISOString();
          return;
        }

        // Process 1-3 records at a time
        const batchSize = Math.min(Math.floor(Math.random() * 3) + 1, results.length - processed);
        for (let i = 0; i < batchSize; i++) {
          const record = results[processed + i];
          const prediction = generateMockPrediction({ id: record.id || processed + i });
          job.predictions.push({
            ...prediction,
            applicant_data: record
          });
        }
        
        processed += batchSize;
        job.processed_records = processed;
        job.updated_at = new Date().toISOString();
        
        // Broadcast progress via WebSocket
        if (wss) {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'batch_progress',
                job_id: jobId,
                progress: {
                  processed_records: processed,
                  total_records: results.length,
                  percentage: Math.round((processed / results.length) * 100)
                }
              }));
            }
          });
        }
      }, 1000 + Math.random() * 2000);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    })
    .on('error', (error) => {
      job.status = 'failed';
      job.error = error.message;
      job.updated_at = new Date().toISOString();
    });

  res.json({
    success: true,
    job_id: jobId,
    message: 'Batch processing started'
  });
});

// Get batch job status
app.get('/api/batch/:jobId/status', (req, res) => {
  const job = batchJobs.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    job
  });
});

// Get batch job results
app.get('/api/batch/:jobId/results', (req, res) => {
  const job = batchJobs.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: 'Job not completed yet'
    });
  }

  res.json({
    success: true,
    predictions: job.predictions,
    metadata: {
      total_records: job.total_records,
      processed_at: job.updated_at,
      filename: job.filename
    }
  });
});

// Prediction history with pagination and filtering
app.get('/api/predictions', (req, res) => {
  const { page = 1, limit = 10, risk_category, date_range, search } = req.query;
  const offset = (page - 1) * limit;
  
  // Generate mock historical data
  const totalRecords = 500;
  const predictions = Array.from({ length: parseInt(limit) }, (_, i) => {
    const prediction = generateMockPrediction();
    // Add some variation to dates
    const daysAgo = Math.floor(Math.random() * 30);
    prediction.processed_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    return prediction;
  });

  res.json({
    success: true,
    predictions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalRecords,
      pages: Math.ceil(totalRecords / limit)
    },
    filters: {
      risk_category,
      date_range,
      search
    }
  });
});

// Model metrics
app.get('/api/model/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: generateMockMetrics()
  });
});

// Dashboard metrics
app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: generateDashboardMetrics()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to mock API WebSocket'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message:', data);
      
      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        data
      }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;