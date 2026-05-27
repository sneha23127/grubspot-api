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

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const res = await pool.query(
      "UPDATE users SET password = $1 WHERE username = 'admin123' RETURNING id, username",
      [hashedPassword]
    );
    console.log("Updated admin password successfully:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

updatePassword();
