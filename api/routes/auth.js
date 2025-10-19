/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { login, getCurrentUser, logout, refresh } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validation');

// POST /api/auth/login - User login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh - Exchange refresh token for new access token
router.post('/refresh', refresh);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/logout - User logout
router.post('/logout', authenticate, logout);

module.exports = router;
