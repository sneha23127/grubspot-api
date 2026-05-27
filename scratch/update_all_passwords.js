const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function updatePasswords() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const res = await pool.query(
      "UPDATE users SET password = $1 WHERE username != 'admin123' OR username IS NULL RETURNING id, email, username",
      [hashedPassword]
    );
    console.log(`Updated passwords to 'password123' for ${res.rowCount} users:`, res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

updatePasswords();
