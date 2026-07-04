const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, validateRegister, validateLogin } = require('../middleware/validate');

const router = express.Router();

// ─── Helper: Generate JWT Tokens ────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, role, tokenId: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// ─── POST /api/auth/register ────────────────────────────────
router.post('/register', registerLimiter, sanitizeInput, validateRegister, async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create user
    const userId = await User.create({ name, email, password, company });

    // Generate tokens
    const tokens = generateTokens(userId, 'user');

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [userId, tokenHash]
    );

    // Set httpOnly cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: { id: userId, name, email, role: 'user', company },
      accessToken: tokens.accessToken // Also send in body for frontend state
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────
router.post('/login', authLimiter, sanitizeInput, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.'
      });
    }

    // Verify password
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, tokenHash]
    );

    // Set httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        total_scans: user.total_scans
      },
      accessToken: tokens.accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// ─── POST /api/auth/refresh-token ───────────────────────────
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required.',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in DB and is not revoked
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const [tokens] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()',
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token revoked or expired.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Revoke old refresh token (rotation — security best practice)
    await pool.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE id = ?',
      [tokens[0].id]
    );

    // Generate new tokens
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    const newTokens = generateTokens(user.id, user.role);

    // Store new refresh token
    const newTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, newTokenHash]
    );

    // Set new cookies
    res.cookie('accessToken', newTokens.accessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 60 * 60 * 1000
    });
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user,
      accessToken: newTokens.accessToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
        code: 'REFRESH_EXPIRED'
      });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed.'
    });
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Revoke the refresh token
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await pool.execute(
        'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?',
        [tokenHash]
      );
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ success: true, message: 'Logged out.' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
