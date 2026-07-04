-- ============================================================
-- CV SCANNER SAAS — Database Schema
-- Engine: MySQL 8+
-- Security: All queries use parameterized statements via mysql2
-- ============================================================

CREATE DATABASE IF NOT EXISTS cv_scanner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cv_scanner;

-- ─── Users Table ─────────────────────────────────────────────
-- Stores all users (admin + regular users)
-- Passwords hashed with bcryptjs (cost factor 12)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  profile_pic VARCHAR(255) DEFAULT NULL,
  company VARCHAR(255) DEFAULT NULL,
  total_scans INT UNSIGNED NOT NULL DEFAULT 0,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Refresh Tokens Table ───────────────────────────────────
-- For JWT refresh token rotation (security best practice)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_token (token_hash),
  INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Jobs Table ──────────────────────────────────────────────
-- Stores job descriptions created by users
CREATE TABLE IF NOT EXISTS jobs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_jobs_user (user_id),
  INDEX idx_jobs_active (is_active),
  INDEX idx_jobs_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Candidates / Scan Results Table ─────────────────────────
-- Stores CV scan results for each candidate
CREATE TABLE IF NOT EXISTS candidates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  job_id INT UNSIGNED DEFAULT NULL,
  candidate_name VARCHAR(255) DEFAULT 'Unknown Candidate',
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size INT UNSIGNED NOT NULL DEFAULT 0,

  -- Scores
  match_score INT UNSIGNED NOT NULL DEFAULT 0,
  skills_match_score INT UNSIGNED NOT NULL DEFAULT 0,
  experience_score INT UNSIGNED NOT NULL DEFAULT 0,
  education_score INT UNSIGNED NOT NULL DEFAULT 0,
  overall_fit_score INT UNSIGNED NOT NULL DEFAULT 0,

  -- Analysis Results (stored as JSON)
  matched_skills JSON DEFAULT NULL,
  partial_match_skills JSON DEFAULT NULL,
  missing_skills JSON DEFAULT NULL,
  extra_skills JSON DEFAULT NULL,

  -- Evaluation
  years_of_experience DECIMAL(4,1) DEFAULT NULL,
  experience_summary TEXT DEFAULT NULL,
  education_match VARCHAR(20) DEFAULT NULL,
  education_details TEXT DEFAULT NULL,
  why_best_fit TEXT DEFAULT NULL,
  strengths TEXT DEFAULT NULL,
  weaknesses TEXT DEFAULT NULL,
  red_flags TEXT DEFAULT NULL,
  recommendation ENUM('Shortlist', 'Consider', 'Reject') DEFAULT 'Consider',

  -- Interview Questions (stored as JSON)
  interview_questions JSON DEFAULT NULL,
  questions_generated TINYINT(1) NOT NULL DEFAULT 0,

  -- Metadata
  job_title VARCHAR(200) DEFAULT NULL,
  job_description TEXT DEFAULT NULL,
  raw_cv_text LONGTEXT DEFAULT NULL,
  ai_analysis_time_ms INT UNSIGNED DEFAULT NULL,
  scan_duration_ms INT UNSIGNED DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  INDEX idx_candidates_user (user_id),
  INDEX idx_candidates_job (job_id),
  INDEX idx_candidates_score (match_score DESC),
  INDEX idx_candidates_created (created_at DESC),
  INDEX idx_candidates_recommendation (recommendation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── API Usage Log (for monitoring and rate limiting) ────────
CREATE TABLE IF NOT EXISTS api_usage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  response_time_ms INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_user (user_id),
  INDEX idx_api_endpoint (endpoint),
  INDEX idx_api_created (created_at),
  INDEX idx_api_status (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Insert Default Admin User ───────────────────────────────
-- Password: Admin@12345 (bcrypt hash)
-- IMPORTANT: Change password on first login
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@cvscanner.com', '$2a$12$LJ3m4ys3Lg3YOCwKkC1OYeKxO0fh0m0m0m0m0m0m0m0m0m0m0m', 'admin')
ON DUPLICATE KEY UPDATE name = 'Admin';

-- Note: The password hash above is a placeholder.
-- The actual hash will be generated when the migration script runs.
