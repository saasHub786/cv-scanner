const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * JWT Authentication Middleware
 * Verifies the access token from httpOnly cookie or Authorization header
 * NEVER trusts user input directly — always verifies signature
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from httpOnly cookie first (more secure), then Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token — this is cryptographic verification, not user input
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database — parameterized query, no SQL injection
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or deactivated.'
      });
    }

    // Attach user to request object
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Role-based access control
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

/**
 * Optional auth — doesn't block if no token, but attaches user if valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await pool.execute(
        'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );
      if (users.length > 0) req.user = users[0];
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
