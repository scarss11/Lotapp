require('dotenv').config();
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const jwt          = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.SESSION_SECRET || 'lotesapp_jwt_secret_2024';

// ─── Middlewares ─────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper: leer usuario del token JWT
function getUsuarioFromToken(req) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Helper: poner token en cookie
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
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
  });
  return token;
}

// Inyectar usuario en req para que las rutas lo usen
app.use((req, res, next) => {
  req.usuario = getUsuarioFromToken(req);
  // Compatibilidad con código viejo que usa req.session.usuario
  req.session = req.session || {};
  req.session.usuario = req.usuario;
  next();
});

// Headers anti-cache en páginas protegidas
app.use((req, res, next) => {
  const protegidas = ['/dashboard','/admin','/lotes','/pagos','/pqrs','/proyecto'];
  if (protegidas.includes(req.path)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ─── API /me ─────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (req.usuario) return res.json({ loggedIn: true, usuario: req.usuario });
  res.json({ loggedIn: false });
});

// ─── Rutas API ───────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/lotes',    require('./routes/lotes'));
app.use('/api/pagos',    require('./routes/pagos'));
app.use('/api/pqrs',     require('./routes/pqrs'));
app.use('/api/proyecto', require('./routes/proyecto'));

// Exponer helpers JWT a las rutas
app.locals.setAuthCookie   = setAuthCookie;
app.locals.getUsuarioFromToken = getUsuarioFromToken;

// ─── Middleware de auth exportado para rutas ─────────────
global._setAuthCookie = setAuthCookie;
global._JWT_SECRET    = JWT_SECRET;

// ─── Páginas HTML protegidas ─────────────────────────────
const paginasCliente = ['dashboard','pagos','pqrs','proyecto'];
const paginasLotes   = ['lotes'];
const paginasAdmin   = ['admin'];

paginasCliente.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    if (!req.usuario) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

paginasLotes.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    if (!req.usuario) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

paginasAdmin.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    if (!req.usuario || req.usuario.rol !== 'admin') return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

['login','registro','reset-password'].forEach(page => {
  app.get(`/${page}`, (req, res) => {
    if (req.usuario) {
      return res.redirect(req.usuario.rol === 'admin' ? '/admin' : '/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/nosotros', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'nosotros.html')));
app.get('/lotes-publicos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'lotes-publicos.html')));

// Logout — eliminar cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/debug', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '✅' : '❌',
    usuario: req.usuario ? req.usuario.email : 'no-session',
    cookie: req.cookies?.auth_token ? '✅ cookie presente' : '❌ sin cookie'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 http://localhost:${PORT}`);
  console.log(`📌 admin@inmobiliaria.com / Admin2024*\n`);
});
