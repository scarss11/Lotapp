require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  // PlanetScale / Railway en producción
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  pool = mysql.createPool({
    host:               process.env.DB_HOST     || '127.0.0.1',
    port:               parseInt(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'inmobiliaria_db',
    waitForConnections: true,
    connectionLimit:    10,
    charset:            'utf8mb4'
  });
}

pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a MySQL establecida');
    conn.release();
  })
  .catch(err => console.error('❌ Error MySQL:', err.message));

const db = {
  query: async (sql, params = []) => pool.execute(sql, params)
};

module.exports = db;
