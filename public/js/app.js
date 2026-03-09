// ─── Toast ──────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||'📌'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(20px)'; toast.style.transition='all .3s'; }, duration - 300);
  setTimeout(() => toast.remove(), duration);
}

// ─── API ─────────────────────────────────────────────────
async function api(url, method = 'GET', data = null, isForm = false) {
  const opts = { method, headers: {} };
  if (data) {
    if (isForm) { opts.body = data; }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
  }
  const res = await fetch(url, opts);
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────
function formatCOP(n) { return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0 }); }
function formatDate(d) { return new Date(d).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'2-digit' }); }
function estadoBadge(estado) {
  const map = { disponible:'success', reservado:'warning', vendido:'danger', pendiente:'warning',
                aprobado:'success', rechazado:'danger', respondida:'success', en_proceso:'info',
                cerrada:'secondary', activa:'success', completada:'info', admin:'info', cliente:'secondary' };
  return `<span class="badge badge-${map[estado]||'secondary'}">${estado}</span>`;
}

// ─── Session ─────────────────────────────────────────────
async function checkSession(requiredRole = null) {
  try {
    const res  = await fetch('/api/me');
    const data = await res.json();
    if (!data.loggedIn) return null;
    if (requiredRole && data.usuario.rol !== requiredRole) return null;
    return data.usuario;
  } catch { return null; }
}

// ─── Logout ──────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

// ─── Modal ───────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ─── Sidebar toggle ──────────────────────────────────────
function initSidebar() {
  const toggle   = document.getElementById('sidebarToggle');
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); backdrop?.classList.toggle('open'); });
  backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });
  // Mark active
  sidebar.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href') === window.location.pathname) a.classList.add('active');
  });
}

// ─── Navbar hamburger ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.navbar-nav')?.classList.toggle('open');
  });
  initSidebar();
});
