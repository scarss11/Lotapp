require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.connect()
  .then(c => { console.log('✅ Conexión a PostgreSQL/Supabase establecida'); c.release(); })
  .catch(err => console.error('❌ Error BD:', err.message));

const db = {
  query: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    return [result.rows, result.fields];
  }
};

module.exports = db;