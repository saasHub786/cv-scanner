-- ============================================================
-- Credits System Migration
-- Run: node migrations/run-credits.js
-- ============================================================

USE cv_scanner;

-- ─── Credit Plans ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_plans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  credits INT UNSIGNED NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT DEFAULT NULL,
  badge VARCHAR(50) DEFAULT NULL,
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── User Credits ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  balance INT UNSIGNED NOT NULL DEFAULT 0,
  total_earned INT UNSIGNED NOT NULL DEFAULT 0,
  total_spent INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Credit Transactions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('purchase', 'scan', 'question_generation', 'bonus', 'refund') NOT NULL,
  amount INT NOT NULL, -- positive for earned, negative for spent
  balance_after INT UNSIGNED NOT NULL DEFAULT 0,
  description VARCHAR(255) DEFAULT NULL,
  reference_id INT UNSIGNED DEFAULT NULL, -- candidates.id if scan/question
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_credits_user (user_id),
  INDEX idx_credits_type (type),
  INDEX idx_credits_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Insert Default Credit Plans ───────────────────────────
INSERT IGNORE INTO credit_plans (name, credits, price, description, badge, is_popular) VALUES
('Free', 5, 0.00, 'Try out CV Scanner with basic features', 'Free', 0),
('Basic', 50, 5.00, 'Perfect for small hiring needs @ 10¢/credit', 'Popular', 1),
('Starter', 200, 20.00, 'For growing recruitment teams @ 10¢/credit', 'Best Value', 0),
('Premium', 500, 50.00, 'Unlimited hiring power @ 10¢/credit', 'Pro', 0);

-- ─── Add credits column to users (tracking field) ──────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT UNSIGNED NOT NULL DEFAULT 0 AFTER total_scans;
