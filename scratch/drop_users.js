const pool = require('../config/db');

async function dropUsers() {
  try {
    const res = await pool.query(`SELECT id, name FROM users WHERE name ILIKE '%arhit%' OR name ILIKE '%meera%'`);
    const users = res.rows;

    if (users.length === 0) {
      console.log('No users found matching "arhit" or "meera".');
      return;
    }

    for (const user of users) {
      console.log(`Found user to delete: ID ${user.id}, Name: ${user.name}`);
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, { method: 'DELETE' });
        const data = await response.json();
        console.log(`Successfully dropped ${user.name} (ID: ${user.id}). Response:`, data.message);
      } catch (err) {
        console.error(`Failed to drop ${user.name} (ID: ${user.id}):`, err.message);
      }
    }
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    pool.end();
  }
}

dropUsers();
