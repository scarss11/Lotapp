const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const { enviarResetPassword } = require('../config/email');

const JWT_SECRET = process.env.SESSION_SECRET || 'lotesapp_jwt_secret_2024';

function setAuthCookie(res, usuario) {
  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
      email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: 'Email y contraseña requeridos.' });

    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length)
      return res.json({ success: false, message: 'Credenciales incorrectas.' });

    const usuario = rows[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match)
      return res.json({ success: false, message: 'Credenciales incorrectas.' });

    setAuthCookie(res, usuario);

    res.json({
      success: true,
      nombre: usuario.nombre,
      rol:    usuario.rol,
      redirect: usuario.rol === 'admin' ? '/admin' : '/dashboard'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.json({ success: false, message: 'Error del servidor.' });
  }
});

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, email, cedula, telefono, password } = req.body;
    if (!nombre || !email || !password)
      return res.json({ success: false, message: 'Campos requeridos incompletos.' });

    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (existe.length)
      return res.json({ success: false, message: 'El correo ya está registrado.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, cedula, telefono, password, rol, email_verificado)
       VALUES ($1,$2,$3,$4,$5,$6,'cliente',true) RETURNING id`,
      [nombre, apellido, email.toLowerCase().trim(), cedula||null, telefono||null, hash]
    );

    const nuevoUsuario = { id: result[0].id, nombre, apellido, email: email.toLowerCase().trim(), rol: 'cliente' };
    setAuthCookie(res, nuevoUsuario);

    res.json({ success: true, nombre, rol: 'cliente', redirect: '/dashboard' });
  } catch (err) {
    console.error('Registro error:', err);
    res.json({ success: false, message: 'Error al registrar.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// POST /api/auth/reset-solicitud
router.post('/reset-solicitud', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = $1', [email?.toLowerCase().trim()]);
    if (!rows.length) return res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });

    const { v4: uuidv4 } = require('uuid');
    const token  = uuidv4();
    const expira = new Date(Date.now() + 3600000);

    await db.query(
      `INSERT INTO reset_tokens (usuario_id, token, expira_en)
       VALUES ($1,$2,$3)
       ON CONFLICT (usuario_id) DO UPDATE SET token=$2, expira_en=$3`,
      [rows[0].id, token, expira]
    );

    try { await enviarResetPassword(email, token); } catch (_) {}
    res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM reset_tokens WHERE token = $1 AND expira_en > NOW()', [token]
    );
    if (!rows.length) return res.json({ success: false, message: 'Token inválido o expirado.' });

    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, rows[0].usuario_id]);
    await db.query('DELETE FROM reset_tokens WHERE token = $1', [token]);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

module.exports = router;
