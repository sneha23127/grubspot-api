const db = require('../db');

async function listTables() {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Existing Tables:', result.rows.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err);
    process.exit(1);
  }
}

listTables();
