/**
 * Batch Processing Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  uploadBatchFile,
  getBatchJobStatus,
  getUserBatchJobs
} = require('../controllers/batchController');
const { exportBatchResults } = require('../controllers/batchController');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: function (req, file, cb) {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// POST /api/batch/upload - Upload batch file for processing
router.post(
  '/upload',
  authorize('admin', 'loan_officer', 'underwriter'),
  upload.single('file'),
  uploadBatchFile
);

// GET /api/batch/:jobId/export - Export batch results (csv, excel, pdf)
router.get('/:jobId/export', authorize('admin', 'loan_officer', 'underwriter'), exportBatchResults);

// Fallback: GET /api/batch/export?jobId=<id>&format=csv
router.get('/export', authorize('admin', 'loan_officer', 'underwriter'), exportBatchResults);

// GET /api/batch/:jobId - Get batch job status
router.get('/:jobId', getBatchJobStatus);

// GET /api/batch - Get user's batch jobs
router.get('/', getUserBatchJobs);

module.exports = router;
