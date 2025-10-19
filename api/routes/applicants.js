/**
 * Applicants Routes
 */

const express = require('express');
const router = express.Router();
const {
  createApplicant,
  getApplicantById,
  getAllApplicants,
  updateApplicant,
  searchApplicants,
} = require('../controllers/applicantsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, applicantSchema } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// POST /api/applicants - Create new applicant
router.post('/', authorize('admin', 'loan_officer'), validate(applicantSchema), createApplicant);

// GET /api/applicants/search - Search applicants
router.get('/search', searchApplicants);

// GET /api/applicants - Get all applicants with pagination
router.get('/', getAllApplicants);

// GET /api/applicants/:id - Get applicant by ID
router.get('/:id', getApplicantById);

// PUT /api/applicants/:id - Update applicant
router.put('/:id', authorize('admin', 'loan_officer'), updateApplicant);

module.exports = router;
