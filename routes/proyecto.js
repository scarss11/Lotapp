const express = require('express');
const router  = express.Router();
const path    = require('path');
const db      = require('../config/db');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const { createUpload, subirArchivo } = require('../config/storage');

// Multer en memoria (sin escritura a disco)
const upload = createUpload({ maxSize: 8 * 1024 * 1024 });

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

// GET /api/proyecto/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM proyectos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.json({ success: false, message: 'No encontrado.' });
    const [etapas] = await db.query('SELECT * FROM etapas WHERE proyecto_id = ? ORDER BY orden ASC', [req.params.id]);
    res.json({ success: true, proyecto: rows[0], etapas });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/proyecto — crear
router.post('/', requireAdmin, upload.array('imagenes', 6), async (req, res) => {
  try {
    const { nombre, inmobiliaria, descripcion, ubicacion, area_total, etapas_json } = req.body;

    // Subir imagenes a Supabase Storage
    const imagenes = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const ext  = path.extname(f.originalname).toLowerCase() || '.jpg';
        const name = 'proy-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) + ext;
        const url  = await subirArchivo(f.buffer, f.mimetype, 'proyectos/' + name);
        imagenes.push(url);
      }
    }

    const imagen_url = imagenes[0] || null;
    const galeria    = JSON.stringify(imagenes);

    const [r] = await db.query(
      'INSERT INTO proyectos (nombre, inmobiliaria, descripcion, ubicacion, area_total, imagen_url, galeria) VALUES (?,?,?,?,?,?,?) RETURNING id',
      [nombre, inmobiliaria || null, descripcion || null, ubicacion || null, area_total || null, imagen_url, galeria]
    );
    const proyId = r[0]?.id || r.insertId;

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
    console.error('Error crear proyecto:', err);
    res.json({ success: false, message: 'Error: ' + err.message });
  }
});

// PUT /api/proyecto/:id — editar
router.put('/:id', requireAdmin, upload.array('imagenes', 6), async (req, res) => {
  try {
    const { nombre, inmobiliaria, descripcion, ubicacion, area_total } = req.body;

    if (req.files && req.files.length) {
      const imagenes = [];
      for (const f of req.files) {
        const ext  = path.extname(f.originalname).toLowerCase() || '.jpg';
        const name = 'proy-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) + ext;
        const url  = await subirArchivo(f.buffer, f.mimetype, 'proyectos/' + name);
        imagenes.push(url);
      }
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
    console.error('Error editar proyecto:', err);
    res.json({ success: false, message: 'Error: ' + err.message });
  }
});

// POST /api/proyecto/asignar
router.post('/asignar', requireAdmin, async (req, res) => {
  try {
    const { lote_id, usuario_id, cuotas_acordadas, fecha_inicio, notas } = req.body;
    if (!lote_id || !usuario_id)
      return res.json({ success: false, message: 'Lote y cliente requeridos.' });

    const [lote] = await db.query("SELECT * FROM lotes WHERE id = ? AND estado = 'disponible'", [lote_id]);
    if (!lote.length)
      return res.json({ success: false, message: 'Lote no disponible.' });

    await db.query(
      `INSERT INTO compras (usuario_id, lote_id, cuotas_acordadas, fecha_inicio, notas)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, lote_id, cuotas_acordadas || 12, fecha_inicio || null, notas || null]
    );
    await db.query("UPDATE lotes SET estado = 'vendido' WHERE id = ?", [lote_id]);

    res.json({ success: true, message: 'Lote asignado correctamente.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error: ' + err.message });
  }
});

module.exports = router;
