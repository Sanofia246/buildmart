const { Pool } = require('pg');

// ── FIX: Render PostgreSQL requires SSL in production ─────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  release();
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = pool;
