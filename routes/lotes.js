const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/img/lotes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, 'lote-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/lotes — público, imagen hereda del proyecto si no tiene propia
router.get('/', async (req, res) => {
  try {
    const { estado, etapa } = req.query;
    let sql = `
      SELECT l.*, e.nombre AS etapa_nombre, p.nombre AS proyecto_nombre,
             p.inmobiliaria AS proyecto_inmobiliaria,
             COALESCE(l.imagen_url, p.imagen_url) AS imagen_display
      FROM lotes l
      JOIN etapas e ON l.etapa_id = e.id
      JOIN proyectos p ON e.proyecto_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { sql += ' AND l.estado = ?'; params.push(estado); }
    if (etapa)  { sql += ' AND l.etapa_id = ?'; params.push(etapa); }
    sql += ' ORDER BY l.codigo ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, lotes: rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error al obtener lotes.' });
  }
});

// GET /api/lotes/cliente/mis-lotes
router.get('/cliente/mis-lotes', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, l.codigo, l.area_m2, l.precio AS precio_total, l.ubicacion,
              COALESCE(l.imagen_url, p.imagen_url) AS imagen_display,
              e.nombre AS etapa_nombre,
              p.nombre AS proyecto_nombre, p.inmobiliaria AS proyecto_inmobiliaria,
              COALESCE(SUM(CASE WHEN pag.estado='aprobado' THEN pag.monto ELSE 0 END),0) AS pagado,
              (l.precio - COALESCE(SUM(CASE WHEN pag.estado='aprobado' THEN pag.monto ELSE 0 END),0)) AS saldo
       FROM compras c
       JOIN lotes l ON c.lote_id = l.id
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos p ON e.proyecto_id = p.id
       LEFT JOIN pagos pag ON pag.compra_id = c.id
       WHERE c.usuario_id = ?
       GROUP BY c.id, l.codigo, l.area_m2, l.precio, l.ubicacion, l.imagen_url,
                p.imagen_url, e.nombre, p.nombre, p.inmobiliaria`,
      [req.session.usuario.id]
    );
    res.json({ success: true, lotes: rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error.' });
  }
});

// GET /api/lotes/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, e.nombre AS etapa_nombre, p.nombre AS proyecto_nombre,
              p.inmobiliaria AS proyecto_inmobiliaria,
              COALESCE(l.imagen_url, p.imagen_url) AS imagen_display
       FROM lotes l
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos p ON e.proyecto_id = p.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'Lote no encontrado.' });
    res.json({ success: true, lote: rows[0] });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/lotes — admin
router.post('/', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { codigo, etapa_id, area_m2, precio, ubicacion, descripcion } = req.body;
    const imagen_url = req.file ? `/img/lotes/${req.file.filename}` : null;
    await db.query(
      `INSERT INTO lotes (codigo, etapa_id, area_m2, precio, ubicacion, descripcion, estado, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?)`,
      [codigo, etapa_id, area_m2, precio, ubicacion || null, descripcion || null, imagen_url]
    );
    res.json({ success: true, message: 'Lote creado.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error al crear lote: ' + err.message });
  }
});

// PUT /api/lotes/:id — admin
router.put('/:id', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { estado, precio, descripcion } = req.body;
    if (req.file) {
      const imagen_url = `/img/lotes/${req.file.filename}`;
      await db.query(
        'UPDATE lotes SET estado=?, precio=?, descripcion=?, imagen_url=? WHERE id=?',
        [estado, precio, descripcion, imagen_url, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE lotes SET estado=?, precio=?, descripcion=? WHERE id=?',
        [estado, precio, descripcion, req.params.id]
      );
    }
    res.json({ success: true, message: 'Lote actualizado.' });
  } catch (err) {
    res.json({ success: false, message: 'Error al actualizar.' });
  }
});


// POST /api/lotes/:id/interes — marcar lote en negociación al hacer clic "Me interesa"
router.post('/:id/interes', async (req, res) => {
  try {
    const [lote] = await db.query("SELECT * FROM lotes WHERE id = ? AND estado = 'disponible'", [req.params.id]);
    if (lote.length) {
      await db.query("UPDATE lotes SET estado = 'negociacion' WHERE id = ? AND estado = 'disponible'", [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

module.exports = router;
