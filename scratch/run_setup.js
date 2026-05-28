const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Clean single quotes if they are present in env variables
const cleanEnvVar = (val) => {
  if (typeof val === 'string' && val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
};

const client = new Client({
  user: cleanEnvVar(process.env.DB_USER),
  host: cleanEnvVar(process.env.DB_HOST),
  database: cleanEnvVar(process.env.DB_NAME),
  password: cleanEnvVar(process.env.DB_PASSWORD),
  port: parseInt(cleanEnvVar(process.env.DB_PORT)) || 5432,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    const sqlPath = path.join(__dirname, '../models/setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('Database tables created/updated successfully from setup.sql!');
  } catch (err) {
    console.error('Error executing setup.sql:', err);
  } finally {
    await client.end();
  }
}

run();
