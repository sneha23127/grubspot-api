const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function findUser() {
  try {
    const res = await pool.query("SELECT id, name, email FROM users WHERE name ILIKE '%ramesh%'");
    console.log("Matching Users:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

findUser();
