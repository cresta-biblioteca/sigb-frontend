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
 *   #pdCareers         — carrera/s
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
const pdCareers = document.getElementById('pdCareers');
const pdCard = document.getElementById('pdCard');
const pdLegajo = document.getElementById('pdLegajo');
const changePasswordBtn = document.getElementById('changePasswordBtn');

function setText(element, value) {
  if (element) element.textContent = value ?? '—';
}

function getCareers(profile) {
  const rawCareers = profile.carreras ?? profile.carrera ?? profile.carreras_usuario;

  if (!rawCareers) return '—';

  if (typeof rawCareers === 'string') {
    const value = rawCareers.trim();
    return value || '—';
  }

  if (!Array.isArray(rawCareers)) return '—';

  const names = rawCareers
    .filter((career) => typeof career === 'string')
    .map((career) => career.trim())
    .filter(Boolean);

  return names.length ? names.join(', ') : '—';
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
  setText(pdCareers, getCareers(profile));
  setText(pdCard, profile.tarjeta);
  setText(pdLegajo, profile.legajo);
} catch {
  if (profileRole) profileRole.textContent = 'Tarjeta: —';
}

// ---------------------------------------------------------------------------
// Cambio de contraseña
// ---------------------------------------------------------------------------
changePasswordBtn?.addEventListener('click', () => {
  const form = document.createElement('form');
  form.className = 'profile-password-form';
  form.innerHTML = `
    <p class="profile-password-form__intro">Ingresá tu contraseña actual y la nueva contraseña para actualizar el acceso.</p>
    <label class="profile-password-form__label">
      Contraseña actual
      <div class="profile-password-form__field">
        <input id="currentPassword" type="password" autocomplete="current-password" class="profile-password-form__input" />
        <button type="button" class="password-toggle profile-password-form__toggle" data-target="currentPassword" aria-label="Mostrar contraseña actual" aria-pressed="false">
          <i class="fas fa-eye" aria-hidden="true"></i>
        </button>
      </div>
    </label>
    <label class="profile-password-form__label">
      Nueva contraseña
      <div class="profile-password-form__field">
        <input id="newPassword" type="password" autocomplete="new-password" class="profile-password-form__input" />
        <button type="button" class="password-toggle profile-password-form__toggle" data-target="newPassword" aria-label="Mostrar nueva contraseña" aria-pressed="false">
          <i class="fas fa-eye" aria-hidden="true"></i>
        </button>
      </div>
    </label>
    <label class="profile-password-form__label">
      Repetir nueva contraseña
      <div class="profile-password-form__field">
        <input id="confirmPassword" type="password" autocomplete="new-password" class="profile-password-form__input" />
        <button type="button" class="password-toggle profile-password-form__toggle" data-target="confirmPassword" aria-label="Mostrar confirmación de contraseña" aria-pressed="false">
          <i class="fas fa-eye" aria-hidden="true"></i>
        </button>
      </div>
    </label>
    <p id="changePasswordError" class="profile-password-form__error"></p>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'profile-password-modal';
  overlay.className = 'profile-password-modal';

  const modal = document.createElement('div');
  modal.className = 'profile-password-modal__dialog';

  modal.innerHTML = `
    <h3 class="profile-password-modal__title">Cambiar contraseña</h3>
    <div id="profile-password-content"></div>
    <div class="profile-password-modal__actions">
      <button type="button" id="profile-password-cancel" class="profile-password-modal__btn profile-password-modal__btn--cancel">Cancelar</button>
      <button type="button" id="profile-password-confirm" class="profile-password-modal__btn profile-password-modal__btn--confirm">Cambiar contraseña</button>
    </div>
  `;

  const contentHost = modal.querySelector('#profile-password-content');
  contentHost.appendChild(form);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let keydownHandler = null;
  const closeModal = () => {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    overlay.remove();
  };

  const cancelButton = modal.querySelector('#profile-password-cancel');
  const confirmButton = modal.querySelector('#profile-password-confirm');
  const currentPasswordInput = form.querySelector('#currentPassword');
  const newPasswordInput = form.querySelector('#newPassword');
  const confirmPasswordInput = form.querySelector('#confirmPassword');
  const passwordToggleButtons = form.querySelectorAll('.password-toggle');
  const errorElement = form.querySelector('#changePasswordError');

  passwordToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetInput = form.querySelector(`#${targetId}`);
      const icon = button.querySelector('i');

      if (!targetInput || !icon) return;

      const isVisible = targetInput.type === 'text';
      targetInput.type = isVisible ? 'password' : 'text';
      button.setAttribute('aria-pressed', String(!isVisible));
      icon.classList.toggle('fa-eye', isVisible);
      icon.classList.toggle('fa-eye-slash', !isVisible);
    });
  });

  const runChangePassword = async () => {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      errorElement.textContent = 'Completá los tres campos.';
      return;
    }

    if (newPassword !== confirmPassword) {
      errorElement.textContent = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (newPassword.length < 8) {
      errorElement.textContent = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    errorElement.textContent = '';
    confirmButton.disabled = true;

    try {
      const response = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      window.alert(response?.message ?? 'Contraseña actualizada correctamente');
      closeModal();
    } catch (error) {
      const backendMessage = error?.data?.error?.message || error?.message;
      errorElement.textContent = backendMessage ?? 'No se pudo cambiar la contraseña.';
    } finally {
      confirmButton.disabled = false;
    }
  };

  cancelButton.addEventListener('click', closeModal);
  confirmButton.addEventListener('click', runChangePassword);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  keydownHandler = function handler(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', keydownHandler);

  if (currentPasswordInput) currentPasswordInput.focus();
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
