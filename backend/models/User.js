const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * All database operations are parameterized — NO SQL injection possible
 * All inputs are sanitized before reaching these methods
 */
class User {
  /**
   * Create a new user
   */
  static async create({ name, email, password, company = null }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, company)
       VALUES (?, ?, ?, ?)`,
      [name, email.toLowerCase(), passwordHash, company]
    );
    return result.insertId;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return users[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_active, company,
              total_scans, last_login, created_at
       FROM users WHERE id = ?`,
      [id]
    );
    return users[0] || null;
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId) {
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );
  }

  /**
   * Increment scan count
   */
  static async incrementScanCount(userId) {
    await pool.execute(
      'UPDATE users SET total_scans = total_scans + 1 WHERE id = ?',
      [userId]
    );
  }

  /**
   * Get all users (admin only) — paginated
   */
  static async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_active, company,
              total_scans, last_login, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM users');
    return { users, total: count, page, limit };
  }

  /**
   * Toggle user active status (admin only)
   */
  static async toggleActive(userId) {
    const [result] = await pool.execute(
      'UPDATE users SET is_active = NOT is_active WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Update user role (admin only)
   */
  static async updateRole(userId, role) {
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
