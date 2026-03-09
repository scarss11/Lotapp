const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/pqrs/mis-pqrs
router.get('/mis-pqrs', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM pqrs WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.session.usuario.id]
    );
    res.json({ success: true, pqrs: rows });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/pqrs
router.post('/', requireAuth, async (req, res) => {
  try {
    const { tipo, asunto, descripcion } = req.body;
    if (!tipo || !asunto || !descripcion)
      return res.json({ success: false, message: 'Todos los campos son requeridos.' });

    await db.query(
      'INSERT INTO pqrs (usuario_id, tipo, asunto, descripcion, estado) VALUES (?, ?, ?, ?, ?)',
      [req.session.usuario.id, tipo, asunto, descripcion, 'pendiente']
    );
    res.json({ success: true, message: 'PQRS enviada correctamente.' });
  } catch (err) {
    res.json({ success: false, message: 'Error al enviar PQRS.' });
  }
});

// GET /api/pqrs/todas — admin
router.get('/todas', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.nombre, u.apellido, u.email
       FROM pqrs p
       JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, pqrs: rows });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// PUT /api/pqrs/:id/responder — admin
router.put('/:id/responder', requireAdmin, async (req, res) => {
  try {
    const { respuesta } = req.body;
    await db.query(
      "UPDATE pqrs SET respuesta = ?, estado = 'respondida', fecha_respuesta = NOW() WHERE id = ?",
      [respuesta, req.params.id]
    );
    res.json({ success: true, message: 'PQRS respondida.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

module.exports = router;
