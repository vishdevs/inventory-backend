// db.js
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL env variable");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Supabase / Render
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
