const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * One-time script to create/reset the admin account.
 * Run from the grubspot-api directory:
 *   node scratch/create_admin.js
 *
 * Default credentials created:
 *   Email   : admin@grubspot.com
 *   Password: Admin@1234
 *
 * Change the password immediately after first login.
 */
async function createAdmin() {
  const name     = 'System Admin';
  const email    = 'admin@grubspot.com';
  const phone    = '+91 9999999999';
  const role     = 'admin';
  const address  = 'Bengaluru';
  // Meets strength policy: 8+ chars, uppercase, number, special char
  const password = 'Admin@1234';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, phone, role, address, password, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active')
       ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             name     = EXCLUDED.name,
             status   = 'Active'
       RETURNING id, name, email, role`,
      [name, email, phone, role, address, hashedPassword]
    );

    console.log('✅ Admin account ready:', result.rows[0]);
    console.log('   Email   :', email);
    console.log('   Password:', password);
    console.log('   ⚠️  Change this password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
