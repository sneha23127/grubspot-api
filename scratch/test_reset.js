const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runTest() {
  try {
    // 1. Get a test user email from the DB
    const res = await pool.query("SELECT email FROM users WHERE role = 'student' LIMIT 1");
    if (res.rows.length === 0) {
      console.log("No student user found in the database. Trying any user...");
      const resAny = await pool.query("SELECT email FROM users LIMIT 1");
      if (resAny.rows.length === 0) {
        console.error("No users found in database to test with.");
        return;
      }
      res.rows.push(resAny.rows[0]);
    }
    
    const testEmail = res.rows[0].email;
    console.log(`Using test user: ${testEmail}`);

    // 2. Request OTP
    console.log("Calling /api/forgot-password...");
    const forgotResponse = await fetch('http://localhost:5000/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotResponse.json();
    
    if (forgotData.status !== 'success') {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotData)}`);
    }
    
    const otp = forgotData.otp;
    console.log(`Received simulated OTP from API: ${otp}`);

    // 3. Reset Password
    console.log("Calling /api/reset-password...");
    const resetResponse = await fetch('http://localhost:5000/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: otp,
        password: 'TestNewPassword123!'
      })
    });
    const resetData = await resetResponse.json();
    
    console.log(`Reset response:`, resetData);
    if (resetData.status !== 'success') {
      throw new Error('Reset password failed');
    }

    // 4. Test Login with new password
    console.log("Testing login with new password...");
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'TestNewPassword123!'
      })
    });
    const loginData = await loginResponse.json();
    
    console.log("Login with new password response status:", loginData.status);
    if (loginData.status === 'success') {
      console.log("✅ End-to-end Password Reset flow works perfectly!");
    } else {
      throw new Error("Login failed with new password");
    }

    // 5. Restore password back to 'password123'
    console.log("Restoring password back to 'password123'...");
    const bcrypt = require('bcryptjs');
    const hashedRestore = await bcrypt.hash('password123', 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedRestore, testEmail]);
    console.log("Password restored.");

  } catch (err) {
    console.error("❌ Test failed:", err.message);
  } finally {
    pool.end();
  }
}

// Give the server 1.5 seconds to make sure it is fully running/reloaded
setTimeout(runTest, 1500);
