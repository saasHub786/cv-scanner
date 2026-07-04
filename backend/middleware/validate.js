const xss = require('xss');

/**
 * Sanitize string inputs against XSS attacks
 * This runs AFTER express-validator but BEFORE database storage
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Strip HTML/script tags from user input
        req.body[key] = xss(req.body[key].trim());
      }
    }
  }
  next();
};

/**
 * Validate registration input
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!password || password.length < 8 || password.length > 128) {
    errors.push('Password must be between 8 and 128 characters.');
  }
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must include uppercase, lowercase, and a number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!password || password.length < 1) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate job description input
 */
const validateJob = (req, res, next) => {
  const { title, description } = req.body;
  const errors = [];

  if (!title || title.length < 3 || title.length > 200) {
    errors.push('Job title must be between 3 and 200 characters.');
  }
  if (!description || description.length < 50 || description.length > 10000) {
    errors.push('Job description must be between 50 and 10,000 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate scan input
 */
const validateScanInput = (req, res, next) => {
  const errors = [];

  if (!req.body.jobId && !req.body.jobDescription) {
    errors.push('Either jobId or jobDescription is required.');
  }

  // CV file validation
  if (!req.file) {
    errors.push('A CV/resume file is required.');
  } else {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      errors.push('Only PDF and DOCX files are accepted.');
    }
    if (req.file.size > 5 * 1024 * 1024) {
      errors.push('File size must be under 5MB.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = {
  sanitizeInput,
  validateRegister,
  validateLogin,
  validateJob,
  validateScanInput
};
