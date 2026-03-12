const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000
  });
  return token;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length) return res.json({ success: false, message: 'Credenciales incorrectas.' });
    const usuario = rows[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.json({ success: false, message: 'Credenciales incorrectas.' });
    setAuthCookie(res, usuario);
    res.json({
      success: true,
      nombre:  usuario.nombre,
      rol:     usuario.rol,
      redirect: usuario.rol === 'admin' ? '/admin' : '/dashboard'
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
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (existe.length) return res.json({ success: false, message: 'El email ya está registrado.' });
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, cedula, telefono, password, rol, email_verificado)
       VALUES ($1, $2, $3, $4, $5, $6, 'cliente', false)`,
      [nombre, apellido, email.toLowerCase().trim(), cedula || null, telefono || null, hash]
    );
    res.json({ success: true, message: 'Cuenta creada. Inicia sesión.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error al registrar.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// GET /api/me
router.get('/me', (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.json({ success: false });
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, usuario: user });
  } catch {
    res.json({ success: false });
  }
});

// POST /api/auth/reset-solicitud
router.post('/reset-solicitud', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = $1', [email?.toLowerCase().trim()]);
    if (!rows.length) return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones.' });
    const token = require('crypto').randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 3600000);
    await db.query(
      `INSERT INTO reset_tokens (usuario_id, token, expira_en)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id) DO UPDATE SET token=$2, expira_en=$3`,
      [rows[0].id, token, expira]
    );
    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM reset_tokens WHERE token = $1 AND expira_en > NOW()',
      [token]
    );
    if (!rows.length) return res.json({ success: false, message: 'Token inválido o expirado.' });
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, rows[0].usuario_id]);
    await db.query('DELETE FROM reset_tokens WHERE token = $1', [token]);
    res.json({ success: true, message: 'Contraseña actualizada.' });
  } catch (err) {
    res.json({ success: false, message: 'Error.' });
  }
});

// DELETE /api/auth/usuarios/:id — admin borra usuario  [NUEVO #1]
router.delete('/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // No permitir borrar el propio admin logueado
    const admin = req.usuario || req.session?.usuario;
    if (String(id) === String(admin.id)) {
      return res.json({ success: false, message: 'No puedes eliminar tu propia cuenta.' });
    }
    // Borrar en cascada: reset_tokens, pagos, compras, pqrs, luego usuario
    await db.query('DELETE FROM reset_tokens WHERE usuario_id = $1', [id]);
    await db.query(`DELETE FROM pagos WHERE compra_id IN (SELECT id FROM compras WHERE usuario_id = $1)`, [id]);
    await db.query('DELETE FROM compras WHERE usuario_id = $1', [id]);
    await db.query('DELETE FROM pqrs WHERE usuario_id = $1', [id]);
    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (err) {
    console.error('Error borrar usuario:', err);
    res.json({ success: false, message: 'Error al eliminar usuario.' });
  }
});

module.exports = router;
