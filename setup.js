require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_NAME = process.env.DB_NAME || 'inmobiliaria_db';

async function setup() {
  console.log('\n🏗️  Iniciando configuración...\n');

  const adminConn = await mysql.createConnection({
    host: process.env.DB_HOST||'127.0.0.1', port: parseInt(process.env.DB_PORT)||3306,
    user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||'', charset:'utf8mb4'
  }).catch(err => { console.error('❌ No se pudo conectar a MySQL:', err.message); process.exit(1); });

  await adminConn.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ BD '${DB_NAME}' lista`);
  await adminConn.end();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST||'127.0.0.1', port: parseInt(process.env.DB_PORT)||3306,
    user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||'',
    database: DB_NAME, charset:'utf8mb4'
  });

  await conn.execute(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL, cedula VARCHAR(20), telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL, rol ENUM('admin','cliente') NOT NULL DEFAULT 'cliente',
    email_verificado TINYINT(1) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ usuarios');

  await conn.execute(`CREATE TABLE IF NOT EXISTS reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT UNIQUE, token VARCHAR(255) NOT NULL,
    expira_en DATETIME NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(200) NOT NULL,
    inmobiliaria VARCHAR(200), descripcion TEXT, ubicacion VARCHAR(300),
    area_total DECIMAL(12,2), imagen_url VARCHAR(300), galeria TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ proyectos');

  await conn.execute(`CREATE TABLE IF NOT EXISTS etapas (
    id INT AUTO_INCREMENT PRIMARY KEY, proyecto_id INT, nombre VARCHAR(100) NOT NULL,
    descripcion TEXT, orden INT DEFAULT 1,
    estado ENUM('activa','completada','pendiente') DEFAULT 'activa',
    fecha_inicio DATE, fecha_fin DATE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ etapas');

  await conn.execute(`CREATE TABLE IF NOT EXISTS lotes (
    id INT AUTO_INCREMENT PRIMARY KEY, etapa_id INT, codigo VARCHAR(50) UNIQUE NOT NULL,
    area_m2 DECIMAL(8,2) NOT NULL, precio DECIMAL(15,2) NOT NULL,
    ubicacion VARCHAR(200), descripcion TEXT, imagen_url VARCHAR(300),
    estado ENUM('disponible','reservado','vendido') DEFAULT 'disponible',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etapa_id) REFERENCES etapas(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ lotes');

  await conn.execute(`CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT, lote_id INT,
    cuotas_acordadas INT DEFAULT 12, fecha_inicio DATE, notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ compras');

  await conn.execute(`CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY, compra_id INT, monto DECIMAL(15,2) NOT NULL,
    tipo_pago VARCHAR(50) DEFAULT 'transferencia', comprobante_url VARCHAR(300),
    notas TEXT, estado ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ pagos');

  await conn.execute(`CREATE TABLE IF NOT EXISTS pqrs (
    id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT,
    tipo ENUM('peticion','queja','reclamo','sugerencia') NOT NULL,
    asunto VARCHAR(200) NOT NULL, descripcion TEXT NOT NULL,
    estado ENUM('pendiente','en_proceso','respondida','cerrada') DEFAULT 'pendiente',
    respuesta TEXT, fecha_respuesta DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('✅ pqrs\n');

  // Admin
  const adminPass = await bcrypt.hash('Admin2024*', 12);
  await conn.execute(`INSERT IGNORE INTO usuarios (nombre,apellido,email,password,rol,email_verificado) VALUES ('Administrador','Sistema','admin@inmobiliaria.com',?,'admin',1)`, [adminPass]);
  console.log('✅ Admin creado');

  // Proyecto demo
  const [pCheck] = await conn.execute("SELECT id FROM proyectos WHERE nombre='Portal del Sol'");
  if (!pCheck.length) {
    const galeria = JSON.stringify([
      '/img/proyecto-fachada.png', '/img/proyecto-interior1.png',
      '/img/proyecto-piscina.png', '/img/proyecto-comedor.png'
    ]);
    const [pRes] = await conn.execute(
      `INSERT INTO proyectos (nombre, inmobiliaria, descripcion, ubicacion, area_total, imagen_url, galeria)
       VALUES ('Portal del Sol','Inciti S.A.S','Proyecto habitacional exclusivo con lotes de 100 a 200 m². Incluye planos habitacionales gratuitos.','Vía Principal Km 5, Municipio del Valle',50000,'/img/proyecto-fachada.png',?)`,
      [galeria]
    );
    const proyId = pRes.insertId;
    const etapasData = [
      ['Lanzamiento','Presentación oficial',1,'completada'],
      ['Preventa','Venta anticipada con precios especiales',2,'activa'],
      ['Construcción','Inicio de obras e infraestructura',3,'pendiente'],
      ['Entrega','Entrega formal de lotes',4,'pendiente']
    ];
    const etapaIds = [];
    for (const [n,d,o,e] of etapasData) {
      const [r] = await conn.execute('INSERT INTO etapas (proyecto_id,nombre,descripcion,orden,estado) VALUES (?,?,?,?,?)',[proyId,n,d,o,e]);
      etapaIds.push(r.insertId);
    }
    const lotes = [
      [etapaIds[1],'A-01',120,85000000,'Manzana A, Lote 1'],
      [etapaIds[1],'A-02',150,105000000,'Manzana A, Lote 2'],
      [etapaIds[1],'A-03',100,72000000,'Manzana A, Lote 3'],
      [etapaIds[1],'B-01',180,128000000,'Manzana B, Lote 1'],
      [etapaIds[1],'B-02',200,142000000,'Manzana B, Lote 2'],
      [etapaIds[1],'C-01',130,93000000,'Manzana C, Lote 1'],
      [etapaIds[1],'C-02',160,115000000,'Manzana C, Lote 2'],
    ];
    for (const [eid,cod,area,precio,ubic] of lotes) {
      await conn.execute('INSERT INTO lotes (etapa_id,codigo,area_m2,precio,ubicacion) VALUES (?,?,?,?,?)',[eid,cod,area,precio,ubic]);
    }
    console.log('✅ Proyecto demo creado con 7 lotes');
  } else {
    console.log('ℹ️  Datos demo ya existen');
  }

  await conn.end();
  console.log('\n🎉 Setup completado!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📧  admin@inmobiliaria.com');
  console.log('  🔑  Admin2024*');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  npm start  →  http://localhost:3000\n');
}

setup().catch(err => { console.error('❌', err.message); process.exit(1); });
