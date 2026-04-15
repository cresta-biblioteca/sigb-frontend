/**
 * Mi Perfil Page Script
 *
 * Primera línea siempre: requireAuth(). Si no hay sesión, redirige antes
 * de que se ejecute cualquier otra cosa en esta página.
 *
 * Flujo:
 *   1. requireAuth()     → verifica sesión, redirige si no hay
 *   2. store.getUser()   → datos básicos del JWT usados como fallback
 *   3. lectoresService.getMyProfile() → consume /lectores/mi-perfil
 *   4. Renderiza nombre, tarjeta y datos del lector en la vista
 *   5. Genera iniciales para el avatar
 *
 * Campos en el HTML:
 *   #navUserName       — nombre en navbar (estado activo, no link)
 *   #profileName       — nombre completo en encabezado
 *   #profileRole       — tarjeta del lector
 *   #profileAvatar     — iniciales del avatar
 *   #pdFullName        — nombre completo en datos personales
 *   #pdDni             — DNI
 *   #pdEmail           — email
 *   #pdPhone           — teléfono
 *   #pdCard            — tarjeta del lector
 *   #pdLegajo          — legajo del lector
 */

import { requireAuth }  from '../core/authGuard.js';
import { store }        from '../core/store.js';
import { authService }  from '../services/authService.js';
import { lectoresService } from '../services/lectoresService.js';
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
const profileRole  = document.getElementById('profileRole');

if (navUserName) navUserName.textContent = fullName;
if (profileName) profileName.textContent = fullName;
if (profileRole) profileRole.textContent = 'Tarjeta: —';

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
// Datos del perfil completo desde el backend
// ---------------------------------------------------------------------------
const pdDni = document.getElementById('pdDni');
const pdEmail = document.getElementById('pdEmail');
const pdPhone = document.getElementById('pdPhone');
const pdCard = document.getElementById('pdCard');
const pdLegajo = document.getElementById('pdLegajo');

function setText(element, value) {
  if (element) element.textContent = value ?? '—';
}

function getInitials(name, surname) {
  const letters = [name, surname].filter(Boolean);

  if (!letters.length) return '?';

  const parts = letters.join(' ').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
}

try {
  const profileResponse = await lectoresService.getMyProfile();
  const profile = profileResponse?.data ?? profileResponse ?? {};
  const backendFullName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || fullName;

  if (navUserName) navUserName.textContent = backendFullName;
  if (profileName) profileName.textContent = backendFullName;
  if (profileRole) profileRole.textContent = `Tarjeta: ${profile.tarjeta ?? '—'}`;

  if (profileAvatar && backendFullName !== 'Usuario') {
    profileAvatar.textContent = getInitials(profile.nombre, profile.apellido);
  }

  setText(pdFullName, backendFullName);
  setText(pdDni, profile.dni);
  setText(pdEmail, profile.email);
  setText(pdPhone, profile.telefono);
  setText(pdCard, profile.tarjeta);
  setText(pdLegajo, profile.legajo);
} catch {
  if (profileRole) profileRole.textContent = 'Tarjeta: —';
}

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
