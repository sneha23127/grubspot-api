const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDuplicates() {
  try {
    const res = await pool.query("SELECT email, count(*) FROM users GROUP BY email HAVING count(*) > 1");
    console.log("Duplicate Emails:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkDuplicates();
