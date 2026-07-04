const pool = require('../config/db');

/**
 * Candidate Model
 * Stores CV scan results and analysis
 */
class Candidate {
  /**
   * Save a new scan result
   */
  static async create(data) {
    // Convert any undefined values to null (MySQL2 bind requires null not undefined)
    const toNull = (v) => (v === undefined ? null : v);
    const toJson = (v) => (v == null ? null : JSON.stringify(v));

    const {
      userId, jobId, candidateName, filename, fileType, fileSize,
      matchScore, skillsMatchScore, experienceScore, educationScore, overallFitScore,
      matchedSkills, partialMatchSkills, missingSkills, extraSkills,
      yearsOfExperience, experienceSummary, educationMatch, educationDetails,
      whyBestFit, strengths, weaknesses, redFlags, recommendation,
      interviewQuestions, questionsGenerated,
      jobTitle, jobDescription, rawCvText, aiAnalysisTimeMs, scanDurationMs
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO candidates (
        user_id, job_id, candidate_name, filename, file_type, file_size,
        match_score, skills_match_score, experience_score, education_score, overall_fit_score,
        matched_skills, partial_match_skills, missing_skills, extra_skills,
        years_of_experience, experience_summary, education_match, education_details,
        why_best_fit, strengths, weaknesses, red_flags, recommendation,
        interview_questions, questions_generated,
        job_title, job_description, raw_cv_text, ai_analysis_time_ms, scan_duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toNull(userId), toNull(jobId), toNull(candidateName), toNull(filename),
        toNull(fileType), toNull(fileSize),
        toNull(matchScore), toNull(skillsMatchScore), toNull(experienceScore),
        toNull(educationScore), toNull(overallFitScore),
        toJson(matchedSkills || []), toJson(partialMatchSkills || []),
        toJson(missingSkills || []), toJson(extraSkills || []),
        toNull(yearsOfExperience), toNull(experienceSummary),
        toNull(educationMatch), toNull(educationDetails),
        toNull(whyBestFit), toNull(strengths), toNull(weaknesses),
        toNull(redFlags), toNull(recommendation),
        interviewQuestions ? JSON.stringify(interviewQuestions) : null,
        questionsGenerated ? 1 : 0,
        toNull(jobTitle), toNull(jobDescription), toNull(rawCvText),
        toNull(aiAnalysisTimeMs), toNull(scanDurationMs)
      ]
    );
    return result.insertId;
  }

  /**
   * Find candidate by ID
   */
  static async findById(id, userId = null) {
    let query = 'SELECT * FROM candidates WHERE id = ?';
    const params = [id];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const [candidates] = await pool.execute(query, params);
    if (candidates[0]) {
      return this._formatCandidate(candidates[0]);
    }
    return null;
  }

  /**
   * Get candidates for a user
   */
  static async findByUserId(userId, page = 1, limit = 20, filters = {}) {
    let query = 'SELECT * FROM candidates WHERE user_id = ?';
    const params = [userId];

    if (filters.jobId) {
      query += ' AND job_id = ?';
      params.push(filters.jobId);
    }
    if (filters.recommendation) {
      query += ' AND recommendation = ?';
      params.push(filters.recommendation);
    }
    if (filters.minScore) {
      query += ' AND match_score >= ?';
      params.push(parseInt(filters.minScore));
    }
    if (filters.search) {
      query += ' AND (candidate_name LIKE ? OR job_title LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const [[{ count }]] = await pool.execute(countQuery, params);

    // Get paginated results
    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [candidates] = await pool.execute(query, params);

    return {
      candidates: candidates.map(c => this._formatCandidate(c)),
      total: count,
      page,
      limit
    };
  }

  /**
   * Update interview questions
   */
  static async updateQuestions(candidateId, questions) {
    const [result] = await pool.execute(
      `UPDATE candidates SET interview_questions = ?, questions_generated = 1
       WHERE id = ?`,
      [JSON.stringify(questions), candidateId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get statistics for a user
   */
  static async getUserStats(userId) {
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM candidates WHERE user_id = ?',
      [userId]
    );
    const [[{ shortlisted }]] = await pool.execute(
      "SELECT COUNT(*) as shortlisted FROM candidates WHERE user_id = ? AND recommendation = 'Shortlist'",
      [userId]
    );
    const [[{ avgScore }]] = await pool.execute(
      'SELECT COALESCE(ROUND(AVG(match_score)), 0) as avgScore FROM candidates WHERE user_id = ?',
      [userId]
    );
    const [[{ topScore }]] = await pool.execute(
      'SELECT COALESCE(MAX(match_score), 0) as topScore FROM candidates WHERE user_id = ?',
      [userId]
    );

    return { totalScans: total, shortlisted, avgScore, topScore };
  }

  /**
   * Get admin-level stats
   */
  static async getAdminStats() {
    const [[{ totalCandidates }]] = await pool.execute('SELECT COUNT(*) as totalCandidates FROM candidates');
    const [[{ totalScans }]] = await pool.execute('SELECT COUNT(*) as totalScans FROM candidates');
    const [[{ avgMatchScore }]] = await pool.execute('SELECT COALESCE(ROUND(AVG(match_score)), 0) as avgMatchScore FROM candidates');
    const [[{ shortlisted }]] = await pool.execute("SELECT COUNT(*) as shortlisted FROM candidates WHERE recommendation = 'Shortlist'");

    return { totalCandidates, totalScans, avgMatchScore, shortlisted };
  }

  /**
   * Format candidate data (parse JSON fields)
   */
  static _formatCandidate(candidate) {
    const parseJson = (field) => {
      if (!field) return [];
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch {
        return [];
      }
    };

    return {
      ...candidate,
      matched_skills: parseJson(candidate.matched_skills),
      partial_match_skills: parseJson(candidate.partial_match_skills),
      missing_skills: parseJson(candidate.missing_skills),
      extra_skills: parseJson(candidate.extra_skills),
      interview_questions: parseJson(candidate.interview_questions)
    };
  }
}

module.exports = Candidate;
