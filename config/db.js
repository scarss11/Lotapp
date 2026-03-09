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

// Convierte ? → $1,$2... para PostgreSQL
const db = {
  query: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql
      .replace(/\?/g, () => `$${++i}`)
      .replace(/AUTO_INCREMENT/gi, '')
      .replace(/ENGINE=InnoDB[^;]*/gi, '')
      .replace(/DEFAULT CHARSET=utf8mb4/gi, '')
      .replace(/ON DUPLICATE KEY UPDATE[^;]*/gi, '')
      .replace(/TINYINT\(1\)/gi, 'BOOLEAN')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/INT AUTO_INCREMENT/gi, 'SERIAL');
    const result = await pool.query(pgSql, params);
    return [result.rows, result.fields];
  }
};

module.exports = db;
