const db = require('../db');

async function removeUnwantedTables() {
  const tablesToRemove = ['admin', 'mess_owner', 'signup'];
  try {
    for (const table of tablesToRemove) {
      await db.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`Dropped table: ${table}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error dropping tables:', err);
    process.exit(1);
  }
}

removeUnwantedTables();
