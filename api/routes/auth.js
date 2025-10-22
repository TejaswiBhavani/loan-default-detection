/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { login, getCurrentUser, logout, refresh } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validation');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');

// POST /api/auth/login - User login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh - Exchange refresh token for new access token
router.post('/refresh', refresh);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/logout - User logout
router.post('/logout', authenticate, logout);

// TEMPORARY: Create admin user for Railway deployment
router.post('/create-admin', async (req, res) => {
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin already exists
    const existingUser = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (existingUser.rows.length > 0) {
      // Update existing admin password
      await query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      res.json({ success: true, message: 'Updated admin password' });
    } else {
      // Create new admin user
      await query(`
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department, phone, is_verified) 
        VALUES (gen_random_uuid(), 'admin', 'admin@example.com', $1, 'Admin', 'User', 'admin', 'IT', '+1-555-0000', true)
      `, [hashedPassword]);
      res.json({ success: true, message: 'Created new admin user' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
