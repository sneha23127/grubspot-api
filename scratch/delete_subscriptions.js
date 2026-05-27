const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function deleteSubscriptions() {
  try {
    const res = await pool.query("DELETE FROM subscriptions");
    console.log(`Successfully deleted ${res.rowCount} subscriptions from the database.`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

deleteSubscriptions();
