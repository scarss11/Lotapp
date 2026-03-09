require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('\n🔧 Ejecutando migración de BD...\n');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST||'127.0.0.1',
    port: parseInt(process.env.DB_PORT)||3306,
    user: process.env.DB_USER||'root',
    password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'inmobiliaria_db',
    charset: 'utf8mb4'
  }).catch(err => { console.error('❌ No se pudo conectar:', err.message); process.exit(1); });

  const alteraciones = [
    // proyectos
    { tabla:'proyectos', columna:'inmobiliaria', sql:"ALTER TABLE proyectos ADD COLUMN inmobiliaria VARCHAR(200) NULL AFTER nombre" },
    { tabla:'proyectos', columna:'imagen_url',   sql:"ALTER TABLE proyectos ADD COLUMN imagen_url VARCHAR(300) NULL" },
    { tabla:'proyectos', columna:'galeria',      sql:"ALTER TABLE proyectos ADD COLUMN galeria TEXT NULL" },
    { tabla:'proyectos', columna:'ubicacion',    sql:"ALTER TABLE proyectos ADD COLUMN ubicacion VARCHAR(300) NULL" },
    { tabla:'proyectos', columna:'area_total',   sql:"ALTER TABLE proyectos ADD COLUMN area_total DECIMAL(12,2) NULL" },
    // lotes
    { tabla:'lotes', columna:'imagen_url', sql:"ALTER TABLE lotes ADD COLUMN imagen_url VARCHAR(300) NULL" },
    { tabla:'lotes', columna:'descripcion', sql:"ALTER TABLE lotes ADD COLUMN descripcion TEXT NULL" },
  ];

  for (const alt of alteraciones) {
    // verificar si la columna ya existe
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME||'inmobiliaria_db', alt.tabla, alt.columna]
    );
    if (cols.length === 0) {
      await conn.execute(alt.sql);
      console.log(`✅ ${alt.tabla}.${alt.columna} — agregada`);
    } else {
      console.log(`ℹ️  ${alt.tabla}.${alt.columna} — ya existe`);
    }
  }

  // Actualizar imagen_url del proyecto demo con las imágenes locales
  await conn.execute(`
    UPDATE proyectos SET 
      inmobiliaria = 'Inciti S.A.S',
      imagen_url   = '/img/proyecto-fachada.png',
      galeria      = '["\/img\/proyecto-fachada.png","\/img\/proyecto-interior1.png","\/img\/proyecto-piscina.png","\/img\/proyecto-comedor.png"]',
      ubicacion    = 'Vía Principal Km 5',
      area_total   = 50000
    WHERE nombre = 'Portal del Sol' AND (inmobiliaria IS NULL OR inmobiliaria = '')
  `);
  console.log('✅ Proyecto demo actualizado con imágenes');

  await conn.end();
  console.log('\n🎉 Migración completada. Reinicia el servidor: npm start\n');
}

migrate().catch(err => { console.error('❌', err.message); process.exit(1); });
