const express = require('express');
const Credit = require('../models/Credit');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/credits/balance ──────────────────────────────
router.get('/balance', authenticate, async (req, res) => {
  try {
    await Credit.ensureUser(req.user.id);
    const balance = await Credit.getBalance(req.user.id);
    res.json({ success: true, ...balance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch balance.' });
  }
});

// ─── GET /api/credits/plans ────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const plans = await Credit.getPlans();
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch plans.' });
  }
});

// ─── GET /api/credits/transactions ─────────────────────────
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await Credit.getTransactions(req.user.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// ─── POST /api/credits/purchase ────────────────────────────
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ success: false, message: 'Plan ID required.' });

    // Get plan
    const pool = require('../config/db');
    const [plans] = await pool.execute('SELECT * FROM credit_plans WHERE id = ? AND is_active = 1', [planId]);
    if (!plans.length) return res.status(404).json({ success: false, message: 'Plan not found.' });

    const plan = plans[0];
    if (plan.price <= 0) {
      // Free plan - just add credits
      await Credit.add(req.user.id, plan.credits, 'bonus', `Free plan: ${plan.credits} credits`);
      const { balance } = await Credit.getBalance(req.user.id);
      return res.json({ success: true, message: `Added ${plan.credits} free credits!`, creditsAdded: plan.credits, balance });
    }

    // Mock payment - in production, integrate Stripe/PayPal here
    const paymentRef = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    await Credit.add(req.user.id, plan.credits, 'purchase', `${plan.name} plan: ${plan.credits} credits @ $${plan.price}`);
    const { balance } = await Credit.getBalance(req.user.id);

    res.json({
      success: true,
      message: `✅ Purchased ${plan.name} plan! ${plan.credits} credits added.`,
      creditsAdded: plan.credits,
      amountPaid: plan.price,
      pricePerCredit: 0.10,
      balance,
      paymentRef
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Purchase failed.' });
  }
});

// ─── POST /api/credits/custom-purchase ─────────────────────
router.post('/custom-purchase', authenticate, async (req, res) => {
  try {
    const { credits } = req.body;
    if (!credits || credits < 1) return res.status(400).json({ success: false, message: 'Minimum 1 credit required.' });
    if (credits > 10000) return res.status(400).json({ success: false, message: 'Maximum 10000 credits per purchase.' });

    const pricePerCredit = 0.10; // $0.10 per credit
    const totalPrice = credits * pricePerCredit;

    const paymentRef = 'CUSTOM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    await Credit.add(req.user.id, credits, 'purchase', `Custom purchase: ${credits} credits @ $${totalPrice.toFixed(2)}`);
    const { balance } = await Credit.getBalance(req.user.id);

    res.json({
      success: true,
      message: `✅ Added ${credits} credits! Amount: $${totalPrice.toFixed(2)}`,
      creditsAdded: credits,
      amountPaid: totalPrice,
      balance,
      paymentRef
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Purchase failed.' });
  }
});

// ─── Admin: GET /api/credits/admin-stats ────────────────────
router.get('/admin-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await Credit.getAdminStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
