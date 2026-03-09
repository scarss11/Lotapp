function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({ success: false, message: 'No autorizado', redirect: '/login' });
  }
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.usuario && req.session.usuario.rol === 'admin') {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  res.redirect('/dashboard');
}

module.exports = { requireAuth, requireAdmin };
