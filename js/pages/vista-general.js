/**
 * Vista General (Dashboard) — Page Script
 *
 * Responsabilidades:
 *   - Sidebar toggle en mobile
 *   - Logout
 *   - Poblar nombre/avatar del usuario logueado en el header
 *   - Mostrar fecha actual en el botón del page-header
 */

import { store } from '../core/store.js';

store.init();

// ── DOM refs ───────────────────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// ── Sidebar toggle (mobile) ────────────────────────────────────────────────
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('admin-sidebar--open');
});

document.addEventListener('click', (e) => {
  if (
    sidebar?.classList.contains('admin-sidebar--open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('admin-sidebar--open');
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────
document.getElementById('btnLogout')?.addEventListener('click', () => {
  store.clearSession();
  window.location.href = 'login.html';
});

// ── Info del usuario en el header ──────────────────────────────────────────
const user = store.getUser();
if (user) {
  const name = [user.nombre, user.apellido].filter(Boolean).join(' ') || 'Admin';
  const headerName   = document.getElementById('headerUserName');
  const headerAvatar = document.getElementById('headerUserAvatar');
  if (headerName)   headerName.textContent   = name;
  if (headerAvatar) headerAvatar.textContent = name.charAt(0).toUpperCase();
}

// ── Fecha actual en page-header ────────────────────────────────────────────
const dateBtn = document.querySelector('.admin-page-header .btn--outline');
if (dateBtn) {
  const now = new Date();
  const formatted = now.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  dateBtn.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatted}`;
}
