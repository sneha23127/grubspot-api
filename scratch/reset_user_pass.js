const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  const targetEmail = 'suresh23@gmail.com';
  const newPass = 'Suresh@12';

  try {
    const res = await pool.query('SELECT id, name, role FROM users WHERE email = $1', [targetEmail]);
    if (res.rows.length === 0) {
      console.log(`❌ User with email "${targetEmail}" was not found in the database.`);
      return;
    }

    const user = res.rows[0];
    console.log(`Found user: ${user.name} (${user.role})`);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPass, salt);

    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, targetEmail]);
    console.log(`✅ Password successfully reset to "${newPass}" for user "${targetEmail}"!`);

  } catch (err) {
    console.error('❌ Error updating password:', err);
  } finally {
    pool.end();
  }
}

main();
