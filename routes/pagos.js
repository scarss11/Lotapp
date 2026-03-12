const express = require('express');
const router  = express.Router();
const path    = require('path');
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { createUpload, subirArchivo } = require('../config/storage');

const upload = createUpload({ maxSize: 5 * 1024 * 1024 });

// GET /api/pagos/mis-pagos — cliente
router.get('/mis-pagos', requireAuth, async (req, res) => {
  try {
    const uid = (req.usuario || req.session?.usuario)?.id;
    const [rows] = await db.query(
      `SELECT p.*, l.codigo AS lote_codigo, c.id AS compra_id,
              pr.nombre AS proyecto_nombre
       FROM pagos p
       JOIN compras c ON p.compra_id = c.id
       JOIN lotes l ON c.lote_id = l.id
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos pr ON e.proyecto_id = pr.id
       WHERE c.usuario_id = $1
       ORDER BY p.fecha_pago DESC`,
      [uid]
    );
    res.json({ success: true, pagos: rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/pagos — cliente registra pago
router.post('/', requireAuth, upload.single('comprobante'), async (req, res) => {
  try {
    const uid = (req.usuario || req.session?.usuario)?.id;
    const { compra_id, monto, tipo_pago, notas } = req.body;
    const [compra] = await db.query(
      'SELECT c.*, l.codigo FROM compras c JOIN lotes l ON c.lote_id = l.id WHERE c.id = $1 AND c.usuario_id = $2',
      [compra_id, uid]
    );
    if (!compra.length) return res.json({ success: false, message: 'Compra no encontrada.' });
    let comprobante_url = null;
    if (req.file) {
      const ext    = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const nombre = Date.now() + '-comprobante' + ext;
      comprobante_url = await subirArchivo(req.file.buffer, req.file.mimetype, 'comprobantes/' + nombre);
    }
    await db.query(
      `INSERT INTO pagos (compra_id, monto, tipo_pago, comprobante_url, notas, estado)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
      [compra_id, monto, tipo_pago || 'transferencia', comprobante_url, notas || null]
    );
    res.json({ success: true, message: 'Pago registrado. Pendiente de aprobación.' });
  } catch (err) {
    console.error('Error registrar pago:', err);
    res.json({ success: false, message: 'Error al registrar pago: ' + err.message });
  }
});

// GET /api/pagos/todos — admin
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.nombre, u.apellido, u.email,
              l.codigo AS lote_codigo,
              pr.nombre AS proyecto_nombre
       FROM pagos p
       JOIN compras c ON p.compra_id = c.id
       JOIN usuarios u ON c.usuario_id = u.id
       JOIN lotes l ON c.lote_id = l.id
       JOIN etapas e ON l.etapa_id = e.id
       JOIN proyectos pr ON e.proyecto_id = pr.id
       ORDER BY p.fecha_pago DESC`
    );
    res.json({ success: true, pagos: rows });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// PUT /api/pagos/:id/estado — admin aprueba/rechaza
router.put('/:id/estado', requireAdmin, async (req, res) => {
  try {
    const { estado } = req.body;
    await db.query('UPDATE pagos SET estado = $1 WHERE id = $2', [estado, req.params.id]);
    res.json({ success: true, message: 'Pago ' + estado + '.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/pagos/compra — admin registra compra de lote
router.post('/compra', requireAdmin, async (req, res) => {
  try {
    const { usuario_id, lote_id, cuotas, fecha_inicio } = req.body;
    const [lote] = await db.query('SELECT * FROM lotes WHERE id = $1 AND estado = $2', [lote_id, 'disponible']);
    if (!lote.length) return res.json({ success: false, message: 'Lote no disponible.' });
    await db.query(
      'INSERT INTO compras (usuario_id, lote_id, cuotas_acordadas, fecha_inicio) VALUES ($1, $2, $3, $4)',
      [usuario_id, lote_id, cuotas || 12, fecha_inicio || new Date()]
    );
    await db.query("UPDATE lotes SET estado = 'vendido' WHERE id = $1", [lote_id]);
    res.json({ success: true, message: 'Compra registrada.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error al registrar compra.' });
  }
});

module.exports = router;
