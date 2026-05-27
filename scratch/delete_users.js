const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function deleteUsers() {
  try {
    // Delete from child tables first if they reference users.id. Assuming 'messes' might reference 'users' 
    // Let's first check if there are foreign key constraints, or just try to delete and catch errors.
    
    // Instead of deleting from messes specifically, we can just delete from users.
    // If it fails due to FK constraint, we'll have to delete from child tables first.
    // Since we don't know the full schema, let's just try deleting users first.
    const res = await pool.query("DELETE FROM users WHERE username != 'admin123' OR username IS NULL RETURNING id");
    console.log(`Deleted ${res.rowCount} users.`);
  } catch (err) {
    console.error("Error deleting users:", err.message);
  } finally {
    pool.end();
  }
}

deleteUsers();
