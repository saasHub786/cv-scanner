const express = require('express');
const path = require('path');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimiter');
const { validateScanInput } = require('../middleware/validate');
const CVParser = require('../services/cvParser');
const aiService = require('../services/aiService');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const User = require('../models/User');
const Credit = require('../models/Credit');

const router = express.Router();

// ─── Multer Storage ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const s = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${s}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and DOCX files are allowed.'), false);
  }
});

const bulkUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1000 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and DOCX files are allowed.'), false);
  }
});

// ─── Credit Check Middleware ─────────────────────────────────
async function checkCredits(userId, required, res) {
  await Credit.ensureUser(userId);
  const { balance } = await Credit.getBalance(userId);
  if ((balance || 0) < required) {
    res.status(402).json({
      success: false,
      message: `Insufficient credits. Need ${required} credit(s), you have ${balance || 0}.`,
      code: 'INSUFFICIENT_CREDITS',
      creditsNeeded: required - (balance || 0),
      balance: balance || 0
    });
    return false;
  }
  return true;
}

// ─── Helper: Single CV Scan ──────────────────────────────────
async function scanSingleCV(file, jobTitle, jobDescription, userId, jobId, candidateName) {
  const start = Date.now();
  try {
    const cvText = await CVParser.extractText(file.path, file.mimetype);
    const analysis = await aiService.analyzeCandidate(cvText, jobTitle, jobDescription);
    const { analysis: ad, evaluation: ev, score_breakdown: sb } = analysis;
    const id = await Candidate.create({
      userId, jobId: jobId || null,
      candidateName: candidateName || path.parse(file.originalname).name,
      filename: file.originalname,
      fileType: path.extname(file.originalname).toLowerCase().replace('.', ''),
      fileSize: file.size,
      matchScore: ad.match_score,
      skillsMatchScore: sb?.skills_match || 0,
      experienceScore: sb?.experience_relevance || 0,
      educationScore: sb?.education || 0,
      overallFitScore: sb?.overall_fit || 0,
      matchedSkills: ad.matched_skills || [],
      partialMatchSkills: ad.partial_match_skills || [],
      missingSkills: ad.missing_skills || [],
      extraSkills: ad.extra_skills || [],
      yearsOfExperience: ad.years_of_experience,
      experienceSummary: ad.experience_summary,
      educationMatch: ad.education_match,
      educationDetails: ad.education_details,
      whyBestFit: ev?.why_best_fit,
      strengths: ev?.strengths, weaknesses: ev?.weaknesses,
      redFlags: ev?.red_flags, recommendation: ev?.recommendation || 'Consider',
      jobTitle, jobDescription,
      rawCvText: cvText.substring(0, 50000),
      aiAnalysisTimeMs: Date.now() - start, scanDurationMs: Date.now() - start
    });
    await User.incrementScanCount(userId);
    return {
      success: true, candidateId: id,
      candidateName: candidateName || path.parse(file.originalname).name,
      filename: file.originalname,
      matchScore: ad.match_score,
      recommendation: ev?.recommendation || 'Consider',
      whyBestFit: ev?.why_best_fit, strengths: ev?.strengths,
      weaknesses: ev?.weaknesses,
      matchedSkills: ad.matched_skills || [], missingSkills: ad.missing_skills || [],
      error: null
    };
  } catch (e) {
    return { success: false, candidateName: candidateName || path.parse(file.originalname).name, filename: file.originalname, error: e.message };
  } finally {
    CVParser.cleanupFile(file.path);
  }
}

// ─── POST /api/scan ──────────────────────────────────────────
router.post('/', authenticate, scanLimiter, (req, res, next) => {
    upload.single('cv')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 5MB.' : err.message });
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // Check credits (1 per scan)
      const canProceed = await checkCredits(req.user.id, 1, res);
      if (!canProceed) return;

      const cvText = await CVParser.extractText(req.file.path, req.file.mimetype);
      let jobTitle = '', jobDescription = '';
      if (req.body.jobId) { const j = await Job.findById(req.body.jobId); if (j) { jobTitle = j.title; jobDescription = j.description; } }
      if (req.body.jobDescription) jobDescription = req.body.jobDescription;
      if (req.body.jobTitle) jobTitle = req.body.jobTitle;
      if (!jobDescription) throw new Error('Job description is required.');

      const analysis = await aiService.analyzeCandidate(cvText, jobTitle, jobDescription);
      const { analysis: ad, evaluation: ev, score_breakdown: sb } = analysis;
      const candidateId = await Candidate.create({
        userId: req.user.id, jobId: req.body.jobId || null,
        candidateName: req.body.candidateName || 'Unknown Candidate',
        filename: req.file.originalname,
        fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
        fileSize: req.file.size,
        matchScore: ad.match_score, skillsMatchScore: sb?.skills_match || 0,
        experienceScore: sb?.experience_relevance || 0, educationScore: sb?.education || 0,
        overallFitScore: sb?.overall_fit || 0,
        matchedSkills: ad.matched_skills || [], partialMatchSkills: ad.partial_match_skills || [],
        missingSkills: ad.missing_skills || [], extraSkills: ad.extra_skills || [],
        yearsOfExperience: ad.years_of_experience, experienceSummary: ad.experience_summary,
        educationMatch: ad.education_match, educationDetails: ad.education_details,
        whyBestFit: ev?.why_best_fit, strengths: ev?.strengths, weaknesses: ev?.weaknesses,
        redFlags: ev?.red_flags, recommendation: ev?.recommendation || 'Consider',
        jobTitle, jobDescription, rawCvText: cvText.substring(0, 50000),
        aiAnalysisTimeMs: 0, scanDurationMs: 0
      });
      await User.incrementScanCount(req.user.id);
      // Deduct 1 credit
      await Credit.deduct(req.user.id, 1, 'scan', `CV scan: ${req.file.originalname}`, candidateId);
      CVParser.cleanupFile(req.file.path);
      const saved = await Candidate.findById(candidateId);
      const { balance } = await Credit.getBalance(req.user.id);
      res.status(201).json({ success: true, message: 'CV scanned!', candidate: saved, creditsRemaining: balance });
    } catch (error) {
      CVParser.cleanupFile(req.file?.path);
      res.status(500).json({ success: false, message: error.message || 'Scan failed.' });
    }
  }
);

// ─── POST /api/scan/bulk ─────────────────────────────────────
router.post('/bulk', authenticate, (req, res, next) => {
    bulkUpload.array('cvs', 1000)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large. Max 5MB each.' });
          if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'Max 1000 files allowed.' });
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ success: false, message: 'No CV files uploaded.' });

      let jobTitle = '', jobDescription = '';
      if (req.body.jobId) { const j = await Job.findById(req.body.jobId); if (j) { jobTitle = j.title; jobDescription = j.description; } }
      if (req.body.jobDescription) jobDescription = req.body.jobDescription;
      if (req.body.jobTitle) jobTitle = req.body.jobTitle;
      if (!jobDescription) return res.status(400).json({ success: false, message: 'Job description is required.' });

      // Check bulk credits
      const needed = files.length;
      const canProceed = await checkCredits(req.user.id, needed, res);
      if (!canProceed) return;

      let candidateNames = [];
      try { candidateNames = JSON.parse(req.body.candidateNames || '[]'); } catch {}

      // Process CVs
      const results = [];
      let deducted = 0;
      for (let i = 0; i < files.length; i++) {
        const result = await scanSingleCV(files[i], jobTitle, jobDescription, req.user.id, req.body.jobId || null, candidateNames[i] || '');
        results.push(result);
        if (result.success) {
          await Credit.deduct(req.user.id, 1, 'scan', `Bulk CV scan: ${result.filename}`, result.candidateId);
          deducted++;
        }
        if (i < files.length - 1) await new Promise(r => setTimeout(r, 800));
      }

      results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      const { balance } = await Credit.getBalance(req.user.id);

      res.json({
        success: true, message: `Scanned ${results.length} CVs!`,
        totalScanned: results.length, successfulScans: results.filter(r => r.success).length,
        failedScans: results.filter(r => !r.success).length,
        creditsUsed: deducted, creditsRemaining: balance,
        results, jobTitle, jobDescription
      });
    } catch (error) {
      console.error('Bulk scan error:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk scan failed.' });
    }
  }
);

// ─── Error Handler ───────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  next(err);
});

module.exports = router;
