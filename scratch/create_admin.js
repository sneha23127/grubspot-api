const db = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const name = 'System Admin';
    const identifier = 'admin123';
    const password = 'admin123';
    const email = 'admin123@grubspot.com'; // Adding a dummy email since it's required in schema
    const phone = '0000000000';
    const role = 'admin';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (name, email, username, phone, role, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, username, email;',
      [name, email, identifier, phone, role, hashedPassword, 'Active']
    );

    console.log('Admin Created Successfully:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
