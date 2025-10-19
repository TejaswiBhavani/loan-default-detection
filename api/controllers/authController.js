/**
 * Authentication Controller
 * Handles user login and JWT token generation
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * User Login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const result = await query(
      `SELECT id, username, email, password_hash, first_name, last_name, 
              role, department, is_active, is_verified 
       FROM users 
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Hash refresh token before storing (security best practice)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Create session record and store hashed refresh token
    await query(
      `INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')`,
      [user.id, token.substring(0, 50), refreshTokenHash, req.ip, req.get('user-agent')]
    );

    // Log the login action (using valid enum value)
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, 'login', 'user_sessions', req.ip, req.get('user-agent'), 'POST', '/api/auth/login', 200]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          department: user.department,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, username, email, first_name, last_name, role, department, 
              phone, is_active, is_verified, last_login_at, created_at
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7);

    // Deactivate session and clear refresh token for security
    await query(
      `UPDATE user_sessions 
       SET is_active = false, refresh_token = NULL, last_activity_at = NOW() 
       WHERE user_id = $1 AND session_token LIKE $2`,
      [req.user.id, token?.substring(0, 50) + '%']
    );

    // Log the logout action (using 'create' as generic action since 'logout' doesn't exist in enum)
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, 'create', 'user_sessions', req.ip, req.get('user-agent'), 'POST', '/api/auth/logout', 200]
    );

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token Exchange
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required.' });
    }

    // Verify refresh token JWT signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
    }

    // Fetch all active sessions for the user to compare hashed tokens
    const sessionsRes = await query(
      `SELECT us.id, us.user_id, us.refresh_token, u.username, u.role 
       FROM user_sessions us 
       JOIN users u ON us.user_id = u.id 
       WHERE us.user_id = $1 AND us.is_active = true AND us.expires_at > NOW()`,
      [decoded.userId]
    );

    if (sessionsRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'No active sessions found.' });
    }

    // Find matching session by comparing provided token against stored hashes
    let matchedSession = null;
    for (const session of sessionsRes.rows) {
      const isMatch = await bcrypt.compare(refreshToken, session.refresh_token);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
    }

    // Issue new access token and rotate refresh token
    const newAccessToken = jwt.sign(
      { userId: matchedSession.user_id, username: matchedSession.username, role: matchedSession.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: matchedSession.user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Hash the new refresh token before storing
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    // Update session with new hashed refresh token and last_activity
    await query(
      `UPDATE user_sessions 
       SET refresh_token = $1, last_activity_at = NOW(), expires_at = NOW() + INTERVAL '7 days' 
       WHERE id = $2`,
      [newRefreshTokenHash, matchedSession.id]
    );

    // Write audit log for token rotation (using 'create' as generic action since 'refresh_token' doesn't exist in enum)
    await query(
      `INSERT INTO audit_logs (user_id, session_id, action, resource_type, ip_address, user_agent, request_method, request_path, response_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [matchedSession.user_id, matchedSession.id, 'create', 'user_sessions', req.ip, req.get('user-agent'), 'POST', '/api/auth/refresh', 200]
    );

    res.json({ 
      success: true, 
      data: { 
        token: newAccessToken, 
        refreshToken: newRefreshToken 
      } 
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  login,
  getCurrentUser,
  logout,
  refresh,
};
