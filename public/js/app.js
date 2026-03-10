// ═══════════════════════════════════════════════════════════
//  LotesApp — app.js  v9  (auth estable)
// ═══════════════════════════════════════════════════════════

// ─── Session check — simple y confiable ──────────────────
async function checkSession(requiredRole = null) {
  try {
    const res  = await fetch('/api/me', { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.loggedIn) return null;
    if (requiredRole && data.usuario.rol !== requiredRole) return null;
    return data.usuario;
  } catch {
    return null;
  }
}

// ─── Toast ───────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||'📌'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all .3s';
  }, duration - 300);
  setTimeout(() => toast.remove(), duration);
}

// ─── API ─────────────────────────────────────────────────
async function api(url, method = 'GET', data = null, isForm = false) {
  try {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (data) {
      if (isForm) { opts.body = data; }
      else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
    }
    const res = await fetch(url, opts);
    return res.json();
  } catch(e) {
    return { success: false, message: 'Error de conexión' };
  }
}

// ─── Helpers ─────────────────────────────────────────────
function formatCOP(n) {
  return '$' + Number(n||0).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'2-digit' }); }
  catch { return '—'; }
}
function estadoBadge(estado) {
  const map = {
    disponible:'success', reservado:'warning', vendido:'danger',
    negociacion:'warning', pendiente:'warning', aprobado:'success',
    rechazado:'danger', respondida:'success', cerrada:'secondary',
    activa:'success', completada:'info', admin:'info', cliente:'secondary', en_proceso:'info'
  };
  const labels = {
    negociacion:'En negociación', disponible:'Disponible', reservado:'Reservado',
    vendido:'Vendido', pendiente:'Pendiente', aprobado:'Aprobado', rechazado:'Rechazado',
    respondida:'Respondida', cerrada:'Cerrada', activa:'Activa', completada:'Completada',
    admin:'Admin', cliente:'Cliente', en_proceso:'En proceso'
  };
  return `<span class="badge badge-${map[estado]||'secondary'}">${labels[estado]||estado}</span>`;
}

// ─── Logout ──────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/login');
}

// ─── Modal ───────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
});

// ─── Image preview ───────────────────────────────────────
function previewImages(input, previewId, max = 10) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = '';
  Array.from(input.files).slice(0, max).forEach(file => {
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

// ─── Sidebar ─────────────────────────────────────────────
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.navbar-nav')?.classList.toggle('open');
  });
  initSidebar();
});
