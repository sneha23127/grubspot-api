// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Determine if we are running in production
const isProduction = process.env.NODE_ENV === 'production';

// Helper to clean single quotes from env vars if present
const cleanEnvVar = (val) => {
  if (typeof val === 'string' && val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
};

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: cleanEnvVar(process.env.DB_USER),
      host: cleanEnvVar(process.env.DB_HOST),
      database: cleanEnvVar(process.env.DB_NAME),
      password: cleanEnvVar(process.env.DB_PASSWORD),
      port: parseInt(cleanEnvVar(process.env.DB_PORT)) || 5432,
    };

if (isProduction) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Helper for running queries safely
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Exported in case you need direct pool access elsewhere
};