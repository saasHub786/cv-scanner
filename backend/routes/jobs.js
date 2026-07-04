const express = require('express');
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');
const { sanitizeInput, validateJob } = require('../middleware/validate');

const router = express.Router();

// ─── GET /api/jobs ──────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await Job.findByUserId(req.user.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
});

// ─── GET /api/jobs/active ───────────────────────────────────
router.get('/active', authenticate, async (req, res) => {
  try {
    const jobs = await Job.getActiveJobs(req.user.id);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get active jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active jobs.' });
  }
});

// ─── GET /api/jobs/:id ──────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    // Ensure user owns this job
    if (job.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
});

// ─── POST /api/jobs ─────────────────────────────────────────
router.post('/', authenticate, sanitizeInput, validateJob, async (req, res) => {
  try {
    const { title, description, department, location } = req.body;
    const jobId = await Job.create({
      userId: req.user.id,
      title,
      description,
      department,
      location
    });
    const job = await Job.findById(jobId);
    res.status(201).json({ success: true, message: 'Job created successfully!', job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
});

// ─── PUT /api/jobs/:id ──────────────────────────────────────
router.put('/:id', authenticate, sanitizeInput, validateJob, async (req, res) => {
  try {
    const { title, description, department, location } = req.body;
    const updated = await Job.update(req.params.id, req.user.id, {
      title, description, department, location
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Job not found or access denied.' });
    }
    const job = await Job.findById(req.params.id);
    res.json({ success: true, message: 'Job updated successfully!', job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job.' });
  }
});

// ─── PATCH /api/jobs/:id/toggle ─────────────────────────────
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const toggled = await Job.toggleActive(req.params.id, req.user.id);
    if (!toggled) {
      return res.status(404).json({ success: false, message: 'Job not found or access denied.' });
    }
    res.json({ success: true, message: 'Job status toggled.' });
  } catch (error) {
    console.error('Toggle job error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle job.' });
  }
});

// ─── DELETE /api/jobs/:id ───────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Job.delete(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Job not found or access denied.' });
    }
    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job.' });
  }
});

module.exports = router;
