const pool = require('../config/db');

async function inspectSubscriptions() {
  try {
    const res = await pool.query("SELECT id, user_id, mess_name, status FROM subscriptions");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

inspectSubscriptions();
