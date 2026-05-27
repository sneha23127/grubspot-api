const pool = require('../config/db');

async function inspectUsers() {
  try {
    const res = await pool.query("SELECT id, name, email, role FROM users LIMIT 10");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

inspectUsers();
