require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

pool.connect()
  .then(c => { console.log('✅ PostgreSQL OK'); c.release(); })
  .catch(err => console.error('❌ Error:', err.message));

const db = {
  query: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    return [result.rows, result.fields];
  }
};

module.exports = db;