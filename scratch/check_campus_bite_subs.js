const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkCampusBiteSubs() {
  try {
    const res = await pool.query("SELECT * FROM subscriptions WHERE mess_name = 'Campus Bite'");
    console.log("Campus Bite Subscriptions:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkCampusBiteSubs();
