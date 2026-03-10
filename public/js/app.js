// ═══════════════════════════════════════════════════════════
//  LotesApp — app.js  v7
// ═══════════════════════════════════════════════════════════

// ─── Auth cache (evita parpadeo / loops) ─────────────────
let _authCache = null;
let _authChecked = false;

async function checkSession(requiredRole = null) {
  if (!_authChecked) {
    try {
      const res  = await fetch('/api/me');
      const data = await res.json();
      _authCache   = data.loggedIn ? data.usuario : null;
      _authChecked = true;
    } catch {
      _authCache   = null;
      _authChecked = true;
    }
  }
  if (!_authCache) return null;
  if (requiredRole && _authCache.rol !== requiredRole) return null;
  return _authCache;
}

// Guard de ruta — muestra spinner mientras verifica
async function requireAuth(role = null) {
  showSpinner();
  const u = await checkSession(role);
  hideSpinner();
  if (!u) {
    window.location.replace('/login');
    return null;
  }
  // Bloquear botón atrás en páginas protegidas
  history.replaceState(null, '', window.location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, '', window.location.href);
  });
  return u;
}

// ─── Spinner global ──────────────────────────────────────
function showSpinner() {
  if (document.getElementById('_globalSpinner')) return;
  const s = document.createElement('div');
  s.id = '_globalSpinner';
  s.innerHTML = `<div style="
    position:fixed;inset:0;background:rgba(255,255,255,.85);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;backdrop-filter:blur(4px);">
    <div style="text-align:center;">
      <div style="width:40px;height:40px;border:3px solid #e5e5ea;
        border-top-color:#007AFF;border-radius:50%;
        animation:spin .7s linear infinite;margin:0 auto 12px;"></div>
      <p style="font-size:14px;color:#8e8e93;font-family:-apple-system,sans-serif;">Verificando sesión...</p>
    </div>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  document.body.appendChild(s);
}
function hideSpinner() {
  document.getElementById('_globalSpinner')?.remove();
}

// ─── Toast ───────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||'📌'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(20px)'; toast.style.transition='all .3s'; }, duration - 300);
  setTimeout(() => toast.remove(), duration);
}

// ─── API fetch ───────────────────────────────────────────
async function api(url, method = 'GET', data = null, isForm = false) {
  try {
    const opts = { method, headers: {} };
    if (data) {
      if (isForm) { opts.body = data; }
      else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
    }
    const res = await fetch(url, opts);
    if (res.status === 401) { window.location.replace('/login'); return { success: false }; }
    return res.json();
  } catch(e) {
    console.error('API error:', e);
    return { success: false, message: 'Error de conexión' };
  }
}

// ─── Helpers ─────────────────────────────────────────────
function formatCOP(n) {
  return '$' + Number(n||0).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'2-digit' });
}
function estadoBadge(estado) {
  const map = {
    disponible:'success', reservado:'warning', vendido:'danger',
    negociacion:'warning', pendiente:'warning', aprobado:'success',
    rechazado:'danger', respondida:'success', cerrada:'secondary',
    activa:'success', completada:'info', pendiente:'warning',
    admin:'info', cliente:'secondary', en_proceso:'info'
  };
  const labels = {
    negociacion:'En negociación', disponible:'Disponible',
    reservado:'Reservado', vendido:'Vendido', pendiente:'Pendiente',
    aprobado:'Aprobado', rechazado:'Rechazado', respondida:'Respondida',
    cerrada:'Cerrada', activa:'Activa', completada:'Completada',
    admin:'Admin', cliente:'Cliente', en_proceso:'En proceso'
  };
  return `<span class="badge badge-${map[estado]||'secondary'}">${labels[estado]||estado}</span>`;
}

// SVG Icons — mismos del dashboard
const ICONS = {
  home: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  card: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`,
  map: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  star: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

// ─── Logout ──────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  _authCache = null; _authChecked = false;
  window.location.replace('/login');
}

// ─── Modal ───────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
document.addEventListener('keydown', e => { if(e.key==='Escape') document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active')); });

// ─── Sidebar toggle ──────────────────────────────────────
function initSidebar() {
  const toggle   = document.getElementById('sidebarToggle');
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); backdrop?.classList.toggle('open'); });
  backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });
  sidebar.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href') === window.location.pathname) a.classList.add('active');
  });
}

// ─── Image preview ───────────────────────────────────────
function previewImages(input, previewId, max = 10) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  const files = Array.from(input.files).slice(0, max);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:80px;height:60px;object-fit:cover;border-radius:8px;margin:4px;';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.navbar-nav')?.classList.toggle('open');
  });
  initSidebar();
});
