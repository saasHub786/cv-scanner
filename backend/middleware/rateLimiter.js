const rateLimit = require('express-rate-limit');
require('dotenv').config();

/**
 * Rate Limiter Middleware
 * Protects against brute force and DoS attacks
 * Different limits for different endpoint types
 */

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for CV scanning (prevent API abuse)
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 scans per hour per user
  message: {
    success: false,
    message: 'Scan limit reached. You can scan up to 30 CVs per hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limit
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour from same IP
  message: {
    success: false,
    message: 'Registration limit reached from this IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, scanLimiter, registerLimiter };
