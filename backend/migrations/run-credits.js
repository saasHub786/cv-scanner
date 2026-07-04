require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  let conn;
  try {
    console.log('🚀 Running credits migration...');
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    const sql = fs.readFileSync(path.join(__dirname, 'add-credits.sql'), 'utf8');
    await conn.query(sql);
    // Give free credits to existing users
    await conn.query(`INSERT IGNORE INTO cv_scanner.user_credits (user_id, balance, total_earned)
      SELECT id, 5, 5 FROM cv_scanner.users WHERE is_active = 1`);
    await conn.query(`UPDATE cv_scanner.users u JOIN cv_scanner.user_credits uc ON u.id = uc.user_id SET u.credits = uc.balance`);
    console.log('✅ Credits system migrated! Free 5 credits given to all users.');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}
run();
