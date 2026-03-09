const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { enviarEmail } = require('../config/email');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: 'Email y contraseña requeridos.' });

    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (!rows.length)
      return res.json({ success: false, message: 'Credenciales incorrectas.' });

    const usuario = rows[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match)
      return res.json({ success: false, message: 'Credenciales incorrectas.' });

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol
    };

    req.session.save((err) => {
      if (err) return res.json({ success: false, message: 'Error al iniciar sesión.' });
      res.json({ success: true, rol: usuario.rol, nombre: usuario.nombre });
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error del servidor.' });
  }
});

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, email, cedula, telefono, password } = req.body;
    if (!nombre || !apellido || !email || !password)
      return res.json({ success: false, message: 'Campos requeridos incompletos.' });

    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (existe.length)
      return res.json({ success: false, message: 'Este email ya está registrado.' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, cedula, telefono, password, rol, email_verificado)
       VALUES (?, ?, ?, ?, ?, ?, 'cliente', 1)`,
      [nombre.trim(), apellido.trim(), email.toLowerCase().trim(), cedula || null, telefono || null, hash]
    );

    const nuevoId = result.insertId;

    try {
      await enviarEmail({
        to: email,
        subject: '¡Bienvenido a Portal del Sol! 🏡',
        html: `<h2>Hola ${nombre}, bienvenido a Portal del Sol</h2><p>Tu cuenta ha sido creada exitosamente.</p>`
      });
    } catch (_) {}

    req.session.usuario = { id: nuevoId, nombre, apellido, email: email.toLowerCase().trim(), rol: 'cliente' };
    req.session.save((err) => {
      if (err) return res.json({ success: false, message: 'Error al crear sesión.' });
      res.json({ success: true, message: 'Cuenta creada exitosamente.' });
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error del servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET /api/me
router.get('/me', (req, res) => {
  if (req.session && req.session.usuario) {
    res.json({ loggedIn: true, usuario: req.session.usuario });
  } else {
    res.json({ loggedIn: false });
  }
});

// POST /api/auth/reset-solicitud
router.post('/reset-solicitud', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (!rows.length)
      return res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });

    const token = uuidv4();
    const expira = new Date(Date.now() + 3600000);

    // MySQL: INSERT ... ON DUPLICATE KEY UPDATE
    await db.query(
      `INSERT INTO reset_tokens (usuario_id, token, expira_en)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token), expira_en = VALUES(expira_en)`,
      [rows[0].id, token, expira]
    );

    const url = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      await enviarEmail({
        to: email,
        subject: 'Recuperar contraseña - Portal del Sol',
        html: `<p>Haz clic para restablecer tu contraseña:</p><a href="${url}">${url}</a><p>Expira en 1 hora.</p>`
      });
    } catch (_) {}

    res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error del servidor.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM reset_tokens WHERE token = ? AND expira_en > NOW()',
      [token]
    );
    if (!rows.length)
      return res.json({ success: false, message: 'Token inválido o expirado.' });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, rows[0].usuario_id]);
    await db.query('DELETE FROM reset_tokens WHERE token = ?', [token]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error del servidor.' });
  }
});

module.exports = router;
