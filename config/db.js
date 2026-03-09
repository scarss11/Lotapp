require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

const db = {
  query: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    try {
      const result = await pool.query(pgSql, params);
      return [result.rows, result.fields];
    } catch (err) {
      console.error('Error BD:', err.message);
      throw err;
    }
  }
};

module.exports = db;
