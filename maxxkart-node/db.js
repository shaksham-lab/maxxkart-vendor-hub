/**
 * db.js — MySQL connection.
 *
 * We use a "pool": a small set of reusable connections, so we don't open a new
 * connection to MySQL for every request (that would be slow).
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maxxkart',
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * Helper so route code stays short.
 * Usage:  const rows = await query('SELECT * FROM vendors WHERE id = ?', [id]);
 * The "?" placeholders protect us from SQL injection.
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
