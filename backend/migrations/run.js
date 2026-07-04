/**
 * Database Migration Runner
 * Reads and executes init.sql to set up the database schema
 * Creates default admin account with properly hashed password
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  let connection;

  try {
    console.log('🚀 Starting database migration...');

    // Connect without database first to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('📦 Connected to MySQL server');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);
    console.log('✅ Schema created successfully');

    // Generate proper password hash for admin
    const adminPassword = 'Admin@12345';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(adminPassword, salt);

    // Update admin user with real hash
    await connection.query('USE cv_scanner');
    await connection.execute(
      `UPDATE users SET password_hash = ? WHERE email = 'admin@cvscanner.com'`,
      [hash]
    );

    console.log('✅ Default admin account created:');
    console.log('   Email:    admin@cvscanner.com');
    console.log('   Password: Admin@12345');
    console.log();
    console.log('⚠️  IMPORTANT: Change the admin password on first login!');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

runMigrations();
