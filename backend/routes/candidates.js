const express = require('express');
const Candidate = require('../models/Candidate');
const Credit = require('../models/Credit');
const aiService = require('../services/aiService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/candidates ────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filters = {
      jobId: req.query.jobId || null,
      recommendation: req.query.recommendation || null,
      minScore: req.query.minScore || null,
      search: req.query.search || null
    };
    const result = await Candidate.findByUserId(req.user.id, page, limit, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candidates.' });
  }
});

// ─── GET /api/candidates/stats ──────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Candidate.getUserStats(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─── GET /api/candidates/:id ────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id, req.user.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, candidate });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candidate.' });
  }
});

// ─── POST /api/candidates/:id/generate-questions ────────────
router.post('/:id/generate-questions', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id, req.user.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Generate interview questions (FREE - no credit needed)
    const result = await aiService.generateInterviewQuestions(candidate);
    const questions = result.questions || [];

    // Save to DB
    await Candidate.updateQuestions(candidate.id, questions);

    res.json({
      success: true, message: 'Interview questions generated!', questions
    });

    res.json({
      success: true, message: 'Interview questions generated!', questions,
      creditsRemaining: newBalance
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate interview questions.' });
  }
});

// ─── DELETE /api/candidates/:id ─────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id, req.user.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    // Delete from database
    const pool = require('../config/db');
    await pool.execute('DELETE FROM candidates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Candidate deleted.' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete candidate.' });
  }
});

module.exports = router;
