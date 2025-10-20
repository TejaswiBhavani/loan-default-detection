/**
 * Predictions Routes
 */

const express = require('express');
const router = express.Router();
const {
  createPrediction,
  getPredictionById,
  getPredictionsByApplication,
  getRecentPredictions,
  exportPredictions,
} = require('../controllers/predictionsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, predictionSchema } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// POST /api/predictions - Create new prediction
router.post(
  '/',
  authorize('admin', 'loan_officer', 'underwriter', 'analyst'),
  validate(predictionSchema),
  createPrediction
);

// GET /api/predictions/recent - Get recent predictions
router.get('/recent', getRecentPredictions);

// GET /api/predictions/export - Export predictions
router.get('/export', exportPredictions);

// GET /api/predictions/application/:applicationId - Get predictions for a specific application
router.get('/application/:applicationId', getPredictionsByApplication);

// GET /api/predictions/:id - Get prediction by ID
router.get('/:id', getPredictionById);

module.exports = router;
