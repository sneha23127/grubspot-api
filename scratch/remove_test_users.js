const db = require('../db');

async function removeTestUsers() {
  try {
    const result = await db.query(`
      DELETE FROM users 
      WHERE name ILIKE '%test%' 
         OR email ILIKE '%test%' 
         OR name ILIKE '%debug%' 
         OR email ILIKE '%debug%'
      RETURNING id, name, email;
    `);
    console.log('Removed Test/Debug Users:', result.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error removing test users:', err);
    process.exit(1);
  }
}

removeTestUsers();
