const db = require('../db');

async function removeAdmins() {
  try {
    const result = await db.query("DELETE FROM users WHERE role = 'admin' RETURNING id, name, email;");
    console.log('Removed Admins:', result.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error removing admins:', err);
    process.exit(1);
  }
}

removeAdmins();
