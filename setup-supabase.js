require('dotenv').config();
const { Pool } = require('pg');

async function setup() {
  console.log('\n🚀 Configurando Supabase...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect().catch(err => {
    console.error('❌ No se pudo conectar:', err.message);
    process.exit(1);
  });

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, apellido VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL, cedula VARCHAR(20), telefono VARCHAR(20),
        password VARCHAR(255) NOT NULL, rol VARCHAR(10) NOT NULL DEFAULT 'cliente',
        email_verificado BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ usuarios');

    await client.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY, usuario_id INT UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL, expira_en TIMESTAMP NOT NULL
      )`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id SERIAL PRIMARY KEY, nombre VARCHAR(200) NOT NULL, inmobiliaria VARCHAR(200),
        descripcion TEXT, ubicacion VARCHAR(300), area_total DECIMAL(12,2),
        imagen_url VARCHAR(300), galeria TEXT, created_at TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ proyectos');

    await client.query(`
      CREATE TABLE IF NOT EXISTS etapas (
        id SERIAL PRIMARY KEY, proyecto_id INT REFERENCES proyectos(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL, descripcion TEXT, orden INT DEFAULT 1,
        estado VARCHAR(20) DEFAULT 'activa', fecha_inicio DATE, fecha_fin DATE
      )`); console.log('✅ etapas');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        id SERIAL PRIMARY KEY, etapa_id INT REFERENCES etapas(id) ON DELETE CASCADE,
        codigo VARCHAR(50) UNIQUE NOT NULL, area_m2 DECIMAL(8,2) NOT NULL,
        precio DECIMAL(15,2) NOT NULL, ubicacion VARCHAR(200), descripcion TEXT,
        imagen_url VARCHAR(300), estado VARCHAR(20) DEFAULT 'disponible',
        created_at TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ lotes');

    await client.query(`
      CREATE TABLE IF NOT EXISTS compras (
        id SERIAL PRIMARY KEY, usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        lote_id INT REFERENCES lotes(id) ON DELETE CASCADE,
        cuotas_acordadas INT DEFAULT 12, fecha_inicio DATE, notas TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ compras');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY, compra_id INT REFERENCES compras(id) ON DELETE CASCADE,
        monto DECIMAL(15,2) NOT NULL, tipo_pago VARCHAR(50) DEFAULT 'transferencia',
        comprobante_url VARCHAR(300), notas TEXT,
        estado VARCHAR(20) DEFAULT 'pendiente', fecha_pago TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ pagos');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pqrs (
        id SERIAL PRIMARY KEY, usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL, asunto VARCHAR(200) NOT NULL, descripcion TEXT NOT NULL,
        estado VARCHAR(20) DEFAULT 'pendiente', respuesta TEXT, fecha_respuesta TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`); console.log('✅ pqrs\n');

    // Admin
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Admin2024*', 12);
    await client.query(`
      INSERT INTO usuarios (nombre,apellido,email,password,rol,email_verificado)
      VALUES ('Administrador','Sistema','admin@inmobiliaria.com',$1,'admin',true)
      ON CONFLICT (email) DO NOTHING`, [hash]);
    console.log('✅ Admin creado');

    // Proyecto demo
    const pCheck = await client.query("SELECT id FROM proyectos WHERE nombre='Portal del Sol'");
    if (!pCheck.rows.length) {
      const galeria = JSON.stringify([
        '/img/proyecto-fachada.png','/img/proyecto-interior1.png',
        '/img/proyecto-piscina.png','/img/proyecto-comedor.png'
      ]);
      const pr = await client.query(`
        INSERT INTO proyectos (nombre,inmobiliaria,descripcion,ubicacion,area_total,imagen_url,galeria)
        VALUES ('Portal del Sol','Inciti S.A.S','Proyecto habitacional con lotes de 100–200 m²',
                'Vía Principal Km 5',50000,'/img/proyecto-fachada.png',$1) RETURNING id`, [galeria]);
      const pid = pr.rows[0].id;

      const etapas = [
        ['Lanzamiento','Presentación oficial',1,'completada'],
        ['Preventa','Venta anticipada',2,'activa'],
        ['Construcción','Obras e infraestructura',3,'pendiente'],
        ['Entrega','Entrega formal de lotes',4,'pendiente']
      ];
      const eids = [];
      for (const [n,d,o,e] of etapas) {
        const r = await client.query(
          'INSERT INTO etapas (proyecto_id,nombre,descripcion,orden,estado) VALUES ($1,$2,$3,$4,$5) RETURNING id',
          [pid,n,d,o,e]);
        eids.push(r.rows[0].id);
      }
      const lotes = [
        [eids[1],'A-01',120,85000000,'Manzana A, Lote 1'],
        [eids[1],'A-02',150,105000000,'Manzana A, Lote 2'],
        [eids[1],'A-03',100,72000000,'Manzana A, Lote 3'],
        [eids[1],'B-01',180,128000000,'Manzana B, Lote 1'],
        [eids[1],'B-02',200,142000000,'Manzana B, Lote 2'],
        [eids[1],'C-01',130,93000000,'Manzana C, Lote 1'],
        [eids[1],'C-02',160,115000000,'Manzana C, Lote 2'],
      ];
      for (const [eid,cod,area,precio,ubic] of lotes) {
        await client.query('INSERT INTO lotes (etapa_id,codigo,area_m2,precio,ubicacion) VALUES ($1,$2,$3,$4,$5)',
          [eid,cod,area,precio,ubic]);
      }
      console.log('✅ Proyecto demo con 7 lotes');
    }

    console.log('\n🎉 Setup Supabase completado!\n');
    console.log('  📧  admin@inmobiliaria.com');
    console.log('  🔑  Admin2024*\n');
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch(err => { console.error('❌', err.message); process.exit(1); });
