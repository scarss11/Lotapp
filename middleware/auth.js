const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.SESSION_SECRET || 'lotesapp_jwt_secret_2024';

function getUsuario(req) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

function requireAuth(req, res, next) {
  const u = getUsuario(req);
  if (!u) return res.status(401).json({ success: false, message: 'No autenticado.' });
  req.session = req.session || {};
  req.session.usuario = u;
  req.usuario = u;
  next();
}

function requireAdmin(req, res, next) {
  const u = getUsuario(req);
  if (!u || u.rol !== 'admin') return res.status(403).json({ success: false, message: 'Acceso denegado.' });
  req.session = req.session || {};
  req.session.usuario = u;
  req.usuario = u;
  next();
}

module.exports = { requireAuth, requireAdmin };
