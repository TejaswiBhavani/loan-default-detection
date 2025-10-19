/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getRiskAnalytics,
  getLoanPurposeAnalytics,
  getUserActivityStats,
  exportDashboardData,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/dashboard - Get dashboard overview
router.get('/', getDashboardOverview);

// GET /api/dashboard/risk-analytics - Get risk analytics
router.get('/risk-analytics', getRiskAnalytics);

// GET /api/dashboard/loan-purpose-analytics - Get loan purpose analytics
router.get('/loan-purpose-analytics', getLoanPurposeAnalytics);

// GET /api/dashboard/user-activity - Get user activity stats
router.get('/user-activity', authorize('admin', 'analyst'), getUserActivityStats);

// GET /api/dashboard/export - Export dashboard data
router.get('/export', authorize('admin', 'analyst'), exportDashboardData);

module.exports = router;
