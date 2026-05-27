const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function deleteRamesh() {
  try {
    // First check if user is a mess owner and delete their mess entry to avoid FK errors if CASCADE isn't set
    await pool.query("DELETE FROM messes WHERE owner_id = (SELECT id FROM users WHERE name = 'Ramesh s')");
    
    // Now delete the user
    const res = await pool.query("DELETE FROM users WHERE name = 'Ramesh s' RETURNING id, name");
    
    if (res.rowCount > 0) {
      console.log(`Successfully deleted user: ${res.rows[0].name} (ID: ${res.rows[0].id})`);
    } else {
      console.log("No user found with the name 'Ramesh s'");
    }
  } catch (err) {
    console.error("Error during deletion:", err.message);
  } finally {
    pool.end();
  }
}

deleteRamesh();
