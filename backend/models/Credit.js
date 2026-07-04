const pool = require('../config/db');

class Credit {
  // Ensure user has a credit row
  static async _ensure(userId) {
    await pool.execute(
      'INSERT IGNORE INTO user_credits (user_id, balance, total_earned) VALUES (?, 5, 5)',
      [userId]
    );
  }

  // Get user credit balance
  static async getBalance(userId) {
    await this._ensure(userId);
    const [rows] = await pool.execute(
      'SELECT balance, total_earned, total_spent FROM user_credits WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0) return { balance: 5, total_earned: 5, total_spent: 0 };
    return rows[0];
  }

  static async ensureUser(userId) {
    await this._ensure(userId);
  }

  // Deduct credits
  static async deduct(userId, amount, type, description, referenceId = null) {
    if (amount <= 0) return true;

    await this._ensure(userId);

    // Check balance
    const [rows] = await pool.execute(
      'SELECT balance FROM user_credits WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (rows.length === 0) return false;

    const currentBalance = rows[0].balance;
    if (!currentBalance || currentBalance < amount) return false;

    // Deduct
    await pool.execute(
      'UPDATE user_credits SET balance = balance - ?, total_spent = total_spent + ? WHERE user_id = ? AND balance >= ?',
      [amount, amount, userId, amount]
    );

    // Get new balance
    const [rows2] = await pool.execute('SELECT balance FROM user_credits WHERE user_id = ?', [userId]);
    const newBalance = rows2.length > 0 ? rows2[0].balance : 0;

    // Transaction log
    await pool.execute(
      'INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, -amount, newBalance, description, referenceId]
    );

    // Update users.credits
    await pool.execute('UPDATE users SET credits = ? WHERE id = ?', [newBalance, userId]);
    return true;
  }

  // Add credits
  static async add(userId, amount, type, description) {
    await this._ensure(userId);
    await pool.execute(
      'UPDATE user_credits SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
      [amount, amount, userId]
    );
    const [rows] = await pool.execute('SELECT balance FROM user_credits WHERE user_id = ?', [userId]);
    const newBalance = rows.length > 0 ? rows[0].balance : amount;

    await pool.execute(
      'INSERT INTO credit_transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [userId, type, amount, newBalance, description]
    );
    await pool.execute('UPDATE users SET credits = ? WHERE id = ?', [newBalance, userId]);
    return true;
  }

  // Get all credit plans
  static async getPlans() {
    const [plans] = await pool.execute(
      'SELECT * FROM credit_plans WHERE is_active = 1 ORDER BY credits ASC'
    );
    return plans;
  }

  // Get transactions
  static async getTransactions(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [txns] = await pool.execute(
      'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM credit_transactions WHERE user_id = ?', [userId]
    );
    return { transactions: txns, total: count, page, limit };
  }

  // Admin stats
  static async getAdminStats() {
    const [[{ totalCredits }]] = await pool.execute('SELECT COALESCE(SUM(balance),0) as totalCredits FROM user_credits');
    const [[{ totalSpent }]] = await pool.execute('SELECT COALESCE(SUM(total_spent),0) as totalSpent FROM user_credits');
    const [[{ totalEarned }]] = await pool.execute('SELECT COALESCE(SUM(total_earned),0) as totalEarned FROM user_credits');
    return { totalCredits, totalSpent, totalEarned };
  }
}

module.exports = Credit;
