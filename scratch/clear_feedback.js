const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Grubspot',
  password: 'Sneha#afk-2003',
  port: 5432,
});

async function clearFeedback() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query('TRUNCATE TABLE tickets RESTART IDENTITY;');
    console.log('Feedback data cleared successfully');
    
  } catch (err) {
    console.error('Error clearing feedback:', err);
  } finally {
    await client.end();
  }
}

clearFeedback();
