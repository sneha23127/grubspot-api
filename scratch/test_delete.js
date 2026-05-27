const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testDelete() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = 26; // Suresh S (mess_owner) to test with
    console.log("Testing complete deletion of user ID:", id);

    // Get user details first
    const userRes = await client.query('SELECT name, email, role, mess_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      console.log("User not found!");
      return;
    }
    const user = userRes.rows[0];
    console.log("User found:", user);

    // 1. Delete associated reviews
    console.log("Deleting reviews...");
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await client.query('DELETE FROM reviews WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await client.query('DELETE FROM reviews WHERE user_id = $1 OR LOWER(user_name) = LOWER($2)', [id, user.name]);
    }

    // 2. Delete associated subscriptions
    console.log("Deleting subscriptions...");
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await client.query('DELETE FROM subscriptions WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await client.query('DELETE FROM subscriptions WHERE user_id = $1 OR LOWER(user_email) = LOWER($2)', [id, user.email]);
    }
    
    // 3. Delete associated tickets
    console.log("Deleting tickets...");
    if (user.role === 'mess_owner') {
      if (user.mess_name) {
        await client.query('DELETE FROM tickets WHERE LOWER(mess_name) = LOWER($1)', [user.mess_name]);
      }
    } else {
      await client.query('DELETE FROM tickets WHERE LOWER(user_name) = LOWER($1)', [user.name]);
    }

    // 4. Delete associated messes
    console.log("Deleting messes...");
    await client.query('DELETE FROM messes WHERE owner_id = $1', [id]);

    // 5. Delete the user
    console.log("Deleting user...");
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, name', [id]);
    console.log("Deleted user result:", result.rows[0]);

    console.log("Success! No errors. Rolling back transaction...");
  } catch (err) {
    console.error("ERROR DETECTED:", err.message);
    console.error("FULL ERROR DETAILS:", err);
  } finally {
    await client.query('ROLLBACK');
    client.release();
    pool.end();
  }
}

testDelete();
