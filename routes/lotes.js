const express = require('express');
const router  = express.Router();
const path    = require('path');
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { createUpload, subirArchivo } = require('../config/storage');

const upload = createUpload({ maxSize: 5 * 1024 * 1024 });

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const { estado, etapa } = req.query;
    let sql = `
      SELECT l.*, e.nombre AS etapa_nombre, p.nombre AS proyecto_nombre,
             p.inmobiliaria AS proyecto_inmobiliaria,
             p.imagen_url AS proyecto_imagen_url,
             COALESCE(l.imagen_url, p.imagen_url) AS imagen_display
      FROM lotes l
      JOIN etapas e ON l.etapa_id = e.id
      JOIN proyectos p ON e.proyecto_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (estado) { sql += ` AND l.estado = $${i++}`; params.push(estado); }
    if (etapa)  { sql += ` AND l.etapa_id = $${i++}`; params.push(etapa); }
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
    const uid = (req.usuario || req.session?.usuario)?.id;
    const [rows] = await db.query(
      `SELECT c.*, l.codigo, l.area_m2, l.precio AS precio_total, l.ubicacion, l.estado AS lote_estado,
              COALESCE(l.imagen_url, p.imagen_url) AS imagen_display,
              p.imagen_url AS proyecto_imagen_url,
              e.nombre AS etapa_nombre,
              p.nombre AS proyecto_nombre, p.id AS proyecto_id,
              p.inmobiliaria AS proyecto_inmobiliaria,
              CAST(COALESCE(SUM(CASE WHEN pag.estado='aprobado' THEN pag.monto ELSE 0 END),0) AS FLOAT) AS pagado,
              CAST((l.precio - COALESCE(SUM(CASE WHEN pag.estado='aprobado' THEN pag.monto ELSE 0 END),0)) AS FLOAT) AS saldo
       FROM compras c
       JOIN lotes l ON c.lote_id = l.id
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos p ON e.proyecto_id = p.id
       LEFT JOIN pagos pag ON pag.compra_id = c.id
       WHERE c.usuario_id = $1
       GROUP BY c.id, l.codigo, l.area_m2, l.precio, l.ubicacion, l.estado, l.imagen_url,
                p.imagen_url, e.nombre, p.nombre, p.id, p.inmobiliaria`,
      [uid]
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
              p.imagen_url AS proyecto_imagen_url,
              COALESCE(l.imagen_url, p.imagen_url) AS imagen_display
       FROM lotes l
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos p ON e.proyecto_id = p.id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'Lote no encontrado.' });
    res.json({ success: true, lote: rows[0] });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/lotes — admin crea
router.post('/', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { codigo, etapa_id, area_m2, precio, ubicacion, descripcion } = req.body;
    let imagen_url = null;
    if (req.file) {
      const ext  = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const name = 'lote-' + Date.now() + ext;
      imagen_url = await subirArchivo(req.file.buffer, req.file.mimetype, 'lotes/' + name);
    }
    await db.query(
      `INSERT INTO lotes (codigo, etapa_id, area_m2, precio, ubicacion, descripcion, estado, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, 'disponible', $7)`,
      [codigo, etapa_id, area_m2, precio, ubicacion || null, descripcion || null, imagen_url]
    );
    res.json({ success: true, message: 'Lote creado.' });
  } catch (err) {
    console.error('Error crear lote:', err);
    res.json({ success: false, message: 'Error al crear lote: ' + err.message });
  }
});

// PUT /api/lotes/:id — admin edita (incluye cambio de estado #3)
router.put('/:id', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { estado, precio, descripcion, ubicacion, area_m2 } = req.body;
    if (req.file) {
      const ext  = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const name = 'lote-' + Date.now() + ext;
      const imagen_url = await subirArchivo(req.file.buffer, req.file.mimetype, 'lotes/' + name);
      await db.query(
        'UPDATE lotes SET estado=$1, precio=$2, descripcion=$3, ubicacion=$4, area_m2=$5, imagen_url=$6 WHERE id=$7',
        [estado, precio, descripcion, ubicacion || null, area_m2 || null, imagen_url, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE lotes SET estado=$1, precio=$2, descripcion=$3, ubicacion=$4, area_m2=$5 WHERE id=$6',
        [estado, precio, descripcion, ubicacion || null, area_m2 || null, req.params.id]
      );
    }
    res.json({ success: true, message: 'Lote actualizado.' });
  } catch (err) {
    console.error('Error actualizar lote:', err);
    res.json({ success: false, message: 'Error al actualizar.' });
  }
});

// PATCH /api/lotes/:id/estado — cambio rápido de estado [NUEVO #3]
router.patch('/:id/estado', requireAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['disponible', 'reservado', 'vendido', 'negociacion'];
    if (!estadosValidos.includes(estado)) {
      return res.json({ success: false, message: 'Estado inválido.' });
    }
    await db.query('UPDATE lotes SET estado=$1 WHERE id=$2', [estado, req.params.id]);
    res.json({ success: true, message: 'Estado actualizado.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/lotes/:id/interes
router.post('/:id/interes', async (req, res) => {
  try {
    const [lote] = await db.query("SELECT * FROM lotes WHERE id = $1 AND estado = 'disponible'", [req.params.id]);
    if (lote.length) {
      await db.query("UPDATE lotes SET estado = 'negociacion' WHERE id = $1 AND estado = 'disponible'", [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

module.exports = router;
