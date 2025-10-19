/**
 * Loan Applications Routes
 */

const express = require('express');
const router = express.Router();
const {
  createLoanApplication,
  getLoanApplicationById,
  getAllLoanApplications,
  updateApplicationStatus,
  deleteLoanApplication,
} = require('../controllers/loanApplicationsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, loanApplicationSchema } = require('../middleware/validation');
const Joi = require('joi');

// All routes require authentication
router.use(authenticate);

// POST /api/loan-applications - Create new loan application
router.post(
  '/',
  authorize('admin', 'loan_officer'),
  validate(loanApplicationSchema),
  createLoanApplication
);

// GET /api/loan-applications - Get all loan applications with filtering
router.get('/', getAllLoanApplications);

// GET /api/loan-applications/:id - Get loan application by ID
router.get('/:id', getLoanApplicationById);

// PATCH /api/loan-applications/:id/status - Update application status
router.patch(
  '/:id/status',
  authorize('admin', 'loan_officer', 'underwriter'),
  validate(
    Joi.object({
      status: Joi.string()
        .valid('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled')
        .required(),
      decision_reason: Joi.string().max(1000).allow('', null),
      assigned_loan_officer: Joi.string().uuid().allow(null),
      assigned_underwriter: Joi.string().uuid().allow(null),
    })
  ),
  updateApplicationStatus
);

// DELETE /api/loan-applications/:id - Delete loan application
router.delete(
  '/:id',
  authorize('admin', 'loan_officer'),
  deleteLoanApplication
);

module.exports = router;
