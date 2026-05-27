const pool = require('../config/db');

async function inspectMesses() {
  try {
    const resUsers = await pool.query("SELECT id, name, role FROM users WHERE role = 'mess_owner'");
    console.log("--- Mess Owners (Users Table) ---");
    console.table(resUsers.rows);

    const resMesses = await pool.query("SELECT id, owner_id, mess_name, latitude, longitude, address FROM messes");
    console.log("--- Messes (Messes Table) ---");
    console.table(resMesses.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

inspectMesses();
