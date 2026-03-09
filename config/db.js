require('dotenv').config();
const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Supabase / producción — usa connection string directa
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  // Local — MySQL legacy (mantener compatibilidad)
  const mysql = require('mysql2/promise');
  const mysqlPool = mysql.createPool({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'inmobiliaria_db',
    waitForConnections: true, connectionLimit: 5, charset: 'utf8mb4',
    enableKeepAlive: true, keepAliveInitialDelay: 0
  });
  module.exports = { query: async (sql, params=[]) => mysqlPool.execute(sql, params) };
  return;
}

pool.connect()
  .then(c => { console.log('✅ Conexión a Supabase/PostgreSQL establecida'); c.release(); })
  .catch(err => console.error('❌ Error BD:', err.message));

// Adaptador: convierte ? → $1,$2,$3 para PostgreSQL
const db = {
  query: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    // Simula formato mysql2: [rows, fields]
    return [result.rows, result.fields];
  }
};

module.exports = db;
