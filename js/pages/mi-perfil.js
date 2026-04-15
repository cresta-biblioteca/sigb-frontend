/**
 * Mi Perfil Page Script
 *
 * Primera línea siempre: requireAuth(). Si no hay sesión, redirige antes
 * de que se ejecute cualquier otra cosa en esta página.
 *
 * Flujo:
 *   1. requireAuth()     → verifica sesión, redirige si no hay
 *   2. store.getUser()   → obtiene datos básicos del JWT (nombre, apellido)
 *   3. Renderiza nombre en navbar y encabezado del perfil
 *   4. Genera iniciales para el avatar
 *   5. Los campos detallados (DNI, email, teléfono, etc.) se llenarán
 *      cuando el endpoint /users/me esté disponible.
 *
 * Campos en el HTML:
 *   #navUserName       — nombre en navbar (estado activo, no link)
 *   #profileName       — nombre completo en encabezado
 *   #profileRole       — tipo de usuario
 *   #profileAvatar     — iniciales del avatar
 *   #pdFullName        — nombre completo en datos personales
 *   #pdDni             — DNI (pendiente endpoint)
 *   #pdEmail           — email (pendiente endpoint)
 *   #pdPhone           — teléfono (pendiente endpoint)
 *   #pdBirthdate       — fecha de nacimiento (pendiente endpoint)
 *   #pdRole            — tipo de usuario (pendiente endpoint)
 *   #pdPlan            — plan de membresía (pendiente endpoint)
 *   #pdMemberSince     — fecha de alta (pendiente endpoint)
 *   #pdReaderId        — ID de lector (pendiente endpoint)
 */

import { requireAuth }  from '../core/authGuard.js';
import { store }        from '../core/store.js';
import { authService }  from '../services/authService.js';
import { Modal }        from '../components/modal.js';

// ---------------------------------------------------------------------------
// Guard — debe ser lo primero que corre en cualquier página protegida
// ---------------------------------------------------------------------------
requireAuth('../index.html');

// A partir de acá, store ya fue inicializado por requireAuth()
const user = store.getUser();

// ---------------------------------------------------------------------------
// Nombre del usuario
// ---------------------------------------------------------------------------
const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Usuario';

const navUserName  = document.getElementById('navUserName');
const profileName  = document.getElementById('profileName');

if (navUserName) navUserName.textContent = fullName;
if (profileName) profileName.textContent = fullName;

// ---------------------------------------------------------------------------
// Avatar con iniciales
// ---------------------------------------------------------------------------
const profileAvatar = document.getElementById('profileAvatar');

if (profileAvatar && fullName !== 'Usuario') {
  const parts    = fullName.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
  profileAvatar.textContent = initials;
}

// ---------------------------------------------------------------------------
// Datos disponibles desde el JWT
// ---------------------------------------------------------------------------
const pdFullName = document.getElementById('pdFullName');
if (pdFullName) pdFullName.textContent = fullName;

// ---------------------------------------------------------------------------
// Datos del perfil completo
//
// TODO: reemplazar con fetch real cuando el endpoint /users/me esté disponible.
//
// import { userService } from '../services/userService.js';
// import { showError }   from '../components/ui.js';
//
// try {
//   const profile = await userService.getMyProfile();
//
//   document.getElementById('pdDni').textContent        = profile.dni;
//   document.getElementById('pdEmail').textContent      = profile.email        ?? '—';
//   document.getElementById('pdPhone').textContent      = profile.telefono     ?? '—';
//   document.getElementById('pdBirthdate').textContent  = profile.fecha_nacimiento ?? '—';
//   document.getElementById('pdRole').textContent       = profile.tipo_usuario;
//   document.getElementById('pdPlan').textContent       = profile.plan;
//   document.getElementById('pdMemberSince').textContent = profile.miembro_desde ?? '—';
//   document.getElementById('pdReaderId').textContent   = profile.lector_id ?? '—';
//
//   document.getElementById('profileRole').textContent  = profile.tipo_usuario;
//
//   if (profile.estado === 'inactivo') {
//     document.getElementById('profileStatusBadge').textContent = 'Inactivo';
//     document.getElementById('profileStatusBadge').classList.replace('badge--success', 'badge--overdue');
//     document.getElementById('pdStatus').textContent = 'Inactivo';
//     document.getElementById('pdStatus').classList.replace('badge--success', 'badge--overdue');
//   }
// } catch {
//   // Los campos quedan en "—". No interrumpimos la experiencia del usuario.
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cambio de contraseña
//
// TODO: implementar modal de cambio de contraseña cuando el endpoint
// POST /auth/change-password esté disponible.
// ---------------------------------------------------------------------------
const changePasswordBtn = document.getElementById('changePasswordBtn');

changePasswordBtn?.addEventListener('click', () => {
  // TODO: abrir modal con campos current_password y new_password
  // Modal.create({ title: 'Cambiar contraseña', ... });
  alert('Cambio de contraseña: disponible cuando el endpoint esté listo.');
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn?.addEventListener('click', () => {
  Modal.create({
    title: 'Cerrar sesión',
    content: '¿Estás seguro que querés cerrar tu sesión?',
    onCancel: () => {},
    onConfirm: async () => {
      logoutBtn.disabled = true;

      try {
        await authService.logout();
      } catch {
        // Si el backend falla, igual limpiamos localmente.
      } finally {
        store.clearSession();
        window.location.href = '../index.html';
      }
    },
  });
});
