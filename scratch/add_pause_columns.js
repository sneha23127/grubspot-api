const db = require('./config/db');
db.query('ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pause_start_date DATE, ADD COLUMN IF NOT EXISTS pause_end_date DATE')
  .then(() => {
    console.log('Columns added successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
