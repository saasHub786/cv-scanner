const pool = require('../config/db');

/**
 * Job Model
 * Stores job descriptions for CV matching
 */
class Job {
  /**
   * Create a new job listing
   */
  static async create({ userId, title, description, department = null, location = null }) {
    const [result] = await pool.execute(
      `INSERT INTO jobs (user_id, title, description, department, location)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, description, department, location]
    );
    return result.insertId;
  }

  /**
   * Find job by ID
   */
  static async findById(id) {
    const [jobs] = await pool.execute(
      `SELECT j.*,
              (SELECT COUNT(*) FROM candidates WHERE job_id = j.id) as candidate_count
       FROM jobs j WHERE j.id = ?`,
      [id]
    );
    return jobs[0] || null;
  }

  /**
   * Get all jobs for a user
   */
  static async findByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [jobs] = await pool.execute(
      `SELECT j.*,
              (SELECT COUNT(*) FROM candidates WHERE job_id = j.id) as candidate_count
       FROM jobs j
       WHERE j.user_id = ?
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM jobs WHERE user_id = ?',
      [userId]
    );
    return { jobs, total: count, page, limit };
  }

  /**
   * Get all active jobs for a user (for dropdown selection)
   */
  static async getActiveJobs(userId) {
    const [jobs] = await pool.execute(
      `SELECT id, title, department, created_at
       FROM jobs
       WHERE user_id = ? AND is_active = 1
       ORDER BY created_at DESC`,
      [userId]
    );
    return jobs;
  }

  /**
   * Update job
   */
  static async update(id, userId, { title, description, department, location }) {
    const [result] = await pool.execute(
      `UPDATE jobs
       SET title = ?, description = ?, department = ?, location = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, department, location, id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Toggle active status
   */
  static async toggleActive(id, userId) {
    const [result] = await pool.execute(
      'UPDATE jobs SET is_active = NOT is_active WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete job and orphan its candidates
   */
  static async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM jobs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get admin-level job stats
   */
  static async getStats() {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM jobs');
    const [[{ active }]] = await pool.execute(
      'SELECT COUNT(*) as active FROM jobs WHERE is_active = 1'
    );
    const [[{ avgCandidates }]] = await pool.execute(
      `SELECT COALESCE(ROUND(AVG(c.cnt)), 0) as avgCandidates
       FROM (SELECT COUNT(*) as cnt FROM candidates GROUP BY job_id) c`
    );
    return { totalJobs: total, activeJobs: active, avgCandidatesPerJob: avgCandidates };
  }
}

module.exports = Job;
