const { Pool } = require('pg');
require('dotenv').config();

// This logic checks if DATABASE_URL exists (Live on Render).
// If it doesn't, it uses your local computer settings.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // This is required for Render's security
      }
    : {
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

module.exports = pool;
// Export the pool instance for use in other parts of your application