require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesión ANTES que las rutas
app.use(session({
  secret: process.env.SESSION_SECRET || 'inmobiliaria_secret_2024',
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rutas API ─────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/lotes',    require('./routes/lotes'));
app.use('/api/pagos',    require('./routes/pagos'));
app.use('/api/pqrs',     require('./routes/pqrs'));
app.use('/api/proyecto', require('./routes/proyecto'));

// Ruta /api/me directa (no como subrouter)
app.get('/api/me', (req, res) => {
  if (req.session && req.session.usuario) {
    return res.json({ loggedIn: true, usuario: req.session.usuario });
  }
  res.json({ loggedIn: false });
});

// ─── Páginas HTML ──────────────────────────────────────────
const pages = ['login','registro','dashboard','lotes','pagos','pqrs','proyecto','admin','reset-password'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📌 Admin: admin@inmobiliaria.com / Admin2024*\n`);
});
