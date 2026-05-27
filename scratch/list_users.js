const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function listUsers() {
  try {
    const res = await pool.query("SELECT id, name, email, role FROM users");
    console.log("Users in database:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

listUsers();
