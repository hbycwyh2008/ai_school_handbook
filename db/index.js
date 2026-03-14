require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
const needsSSL = url && !url.includes('localhost') && !url.includes('127.0.0.1');
const pool = new Pool({
  connectionString: url,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

module.exports = { query, pool };
