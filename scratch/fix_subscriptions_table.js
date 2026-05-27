const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addEmailColumn() {
  try {
    await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)");
    console.log("Successfully added user_email column to subscriptions table.");
  } catch (err) {
    console.error("Error adding column:", err.message);
  } finally {
    pool.end();
  }
}

addEmailColumn();
