const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/img/proyectos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, 'proy-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const [proyectos] = await db.query('SELECT * FROM proyectos ORDER BY id ASC');
    const [etapas]   = await db.query('SELECT * FROM etapas ORDER BY orden ASC');
    res.json({ success: true, proyectos, etapas });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

router.get('/estadisticas', async (req, res) => {
  try {
    const [[tots]]    = await db.query('SELECT COUNT(*) AS total FROM lotes');
    const [[disps]]   = await db.query("SELECT COUNT(*) AS total FROM lotes WHERE estado='disponible'");
    const [[vends]]   = await db.query("SELECT COUNT(*) AS total FROM lotes WHERE estado='vendido'");
    const [[area]]    = await db.query('SELECT AVG(area_m2) AS promedio FROM lotes');
    const [[usuarios]]= await db.query("SELECT COUNT(*) AS total FROM usuarios WHERE rol='cliente'");
    res.json({ success: true, stats: {
      total_lotes: tots.total, disponibles: disps.total, vendidos: vends.total,
      area_promedio: Math.round(area.promedio || 0), total_clientes: usuarios.total
    }});
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

router.get('/usuarios', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, apellido, email, cedula, telefono, rol, created_at FROM usuarios ORDER BY created_at DESC"
    );
    res.json({ success: true, usuarios: rows });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/proyecto — crear proyecto (admin)
router.post('/', requireAdmin, upload.array('imagenes', 6), async (req, res) => {
  try {
    const { nombre, inmobiliaria, descripcion, ubicacion, area_total, etapas_json } = req.body;
    const imagenes = req.files ? req.files.map(f => `/img/proyectos/${f.filename}`) : [];
    const imagen_url = imagenes[0] || null;
    const galeria    = JSON.stringify(imagenes);

    const [r] = await db.query(
      'INSERT INTO proyectos (nombre, inmobiliaria, descripcion, ubicacion, area_total, imagen_url, galeria) VALUES (?,?,?,?,?,?,?)',
      [nombre, inmobiliaria || null, descripcion || null, ubicacion || null, area_total || null, imagen_url, galeria]
    );
    const proyId = r.insertId;

    // Crear etapas si vienen
    if (etapas_json) {
      try {
        const etapas = JSON.parse(etapas_json);
        for (const e of etapas) {
          await db.query(
            'INSERT INTO etapas (proyecto_id, nombre, descripcion, orden, estado) VALUES (?,?,?,?,?)',
            [proyId, e.nombre, e.descripcion || '', e.orden || 1, e.estado || 'pendiente']
          );
        }
      } catch(_) {}
    }

    res.json({ success: true, message: 'Proyecto creado.', id: proyId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error: ' + err.message });
  }
});

// PUT /api/proyecto/:id — editar proyecto
router.put('/:id', requireAdmin, upload.array('imagenes', 6), async (req, res) => {
  try {
    const { nombre, inmobiliaria, descripcion, ubicacion, area_total } = req.body;
    if (req.files && req.files.length) {
      const imagenes = req.files.map(f => `/img/proyectos/${f.filename}`);
      await db.query(
        'UPDATE proyectos SET nombre=?, inmobiliaria=?, descripcion=?, ubicacion=?, area_total=?, imagen_url=?, galeria=? WHERE id=?',
        [nombre, inmobiliaria||null, descripcion||null, ubicacion||null, area_total||null, imagenes[0], JSON.stringify(imagenes), req.params.id]
      );
    } else {
      await db.query(
        'UPDATE proyectos SET nombre=?, inmobiliaria=?, descripcion=?, ubicacion=?, area_total=? WHERE id=?',
        [nombre, inmobiliaria||null, descripcion||null, ubicacion||null, area_total||null, req.params.id]
      );
    }
    res.json({ success: true, message: 'Proyecto actualizado.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

module.exports = router;
