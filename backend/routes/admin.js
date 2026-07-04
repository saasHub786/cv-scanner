const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Credit = require('../models/Credit');
const pool = require('../config/db');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// ─── GET /api/admin/dashboard ───────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ activeUsers }]] = await pool.execute('SELECT COUNT(*) as activeUsers FROM users WHERE is_active = 1');
    const [[{ newUsersToday }]] = await pool.execute('SELECT COUNT(*) as newUsersToday FROM users WHERE DATE(created_at) = CURDATE()');
    const jobStats = await Job.getStats();
    const candidateStats = await Candidate.getAdminStats();

    const [recentScans] = await pool.execute(
      `SELECT c.id, c.candidate_name, c.match_score, c.recommendation, c.created_at, u.name as user_name, c.job_title
       FROM candidates c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 10`
    );
    const [recentUsers] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    const [scanActivity] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM candidates
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );

    res.json({ success: true,
      stats: { users: { total: totalUsers, active: activeUsers, newToday: newUsersToday }, jobs: jobStats, candidates: candidateStats },
      recentScans, recentUsers, scanActivity
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
});

// ─── GET /api/admin/users ───────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await User.getAll(page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// ─── PATCH /api/admin/users/:id/toggle-active ──────────────
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }
    const toggled = await User.toggleActive(req.params.id);
    if (!toggled) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User status updated.' });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// ─── PATCH /api/admin/users/:id/role ────────────────────────
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    const updated = await User.updateRole(req.params.id, role);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User role updated.' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
});

// ─── GET /api/admin/candidates ──────────────────────────────
router.get('/candidates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    let query = `SELECT c.*, u.name as user_name, u.email as user_email FROM candidates c JOIN users u ON c.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (req.query.recommendation) { conditions.push('c.recommendation = ?'); params.push(req.query.recommendation); }
    if (req.query.userId) { conditions.push('c.user_id = ?'); params.push(req.query.userId); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');

    const countQuery = query.replace('SELECT c.*, u.name as user_name, u.email as user_email', 'SELECT COUNT(*) as count');
    const [[{ count }]] = await pool.execute(countQuery, params);

    const offset = (page - 1) * limit;
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [candidates] = await pool.execute(query, params);
    const parseJson = (field) => { if (!field) return []; try { return typeof field === 'string' ? JSON.parse(field) : field; } catch { return []; } };

    res.json({ success: true, candidates: candidates.map(c => ({ ...c, matched_skills: parseJson(c.matched_skills), missing_skills: parseJson(c.missing_skills), interview_questions: parseJson(c.interview_questions) })), total: count, page, limit });
  } catch (error) {
    console.error('Admin get candidates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candidates.' });
  }
});

// ─── GET /api/admin/scans-over-time ─────────────────────────
router.get('/scans-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [data] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM candidates
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Scans over time error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch data.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CREDIT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ─── GET /api/admin/credits ────────────────────────────────
router.get('/credits', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.is_active,
              COALESCE(uc.balance, 0) as balance,
              COALESCE(uc.total_earned, 0) as total_earned,
              COALESCE(uc.total_spent, 0) as total_spent
       FROM users u LEFT JOIN user_credits uc ON u.id = uc.user_id
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM users');

    res.json({ success: true, users, total: count, page, limit });
  } catch (error) {
    console.error('Admin credits error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credits data.' });
  }
});

// ─── POST /api/admin/credits/add ───────────────────────────
router.post('/credits/add', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Valid userId and amount (>=1) required.' });
    }
    if (amount > 100000) {
      return res.status(400).json({ success: false, message: 'Max 100,000 credits per transaction.' });
    }

    await Credit.add(userId, parseInt(amount), 'bonus', reason || `Admin added ${amount} credits`);
    const { balance } = await Credit.getBalance(userId);

    res.json({ success: true, message: `✅ Added ${amount} credits to user #${userId}`, balance });
  } catch (error) {
    console.error('Admin add credits error:', error);
    res.status(500).json({ success: false, message: 'Failed to add credits.' });
  }
});

// ─── POST /api/admin/credits/remove ────────────────────────
router.post('/credits/remove', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Valid userId and amount (>=1) required.' });
    }

    const { balance } = await Credit.getBalance(userId);
    const removeAmt = parseInt(amount);

    if (balance < removeAmt) {
      return res.status(400).json({ success: false, message: `User has ${balance} credits. Cannot remove ${removeAmt}.` });
    }

    await pool.execute(
      'UPDATE user_credits SET balance = balance - ?, total_spent = total_spent + ? WHERE user_id = ? AND balance >= ?',
      [removeAmt, removeAmt, userId, removeAmt]
    );

    const newBalance = balance - removeAmt;
    await pool.execute(
      'INSERT INTO credit_transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [userId, 'refund', -removeAmt, newBalance, reason || `Admin removed ${removeAmt} credits`]
    );
    await pool.execute('UPDATE users SET credits = ? WHERE id = ?', [newBalance, userId]);

    res.json({ success: true, message: `✅ Removed ${removeAmt} credits from user #${userId}`, balance: newBalance });
  } catch (error) {
    console.error('Admin remove credits error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove credits.' });
  }
});

// ─── GET /api/admin/transaction-logs ───────────────────────
router.get('/transaction-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const [txns] = await pool.execute(
      `SELECT ct.*, u.name as user_name, u.email as user_email
       FROM credit_transactions ct JOIN users u ON ct.user_id = u.id
       ORDER BY ct.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM credit_transactions');

    res.json({ success: true, transactions: txns, total: count, page, limit });
  } catch (error) {
    console.error('Transaction logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

module.exports = router;
