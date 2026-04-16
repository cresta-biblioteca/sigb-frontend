/**
 * Gestión de Usuarios — Page Script
 *
 * Maneja la sección de gestión de usuarios del panel staff.
 *
 * Funcionalidad actual:
 *   - Alta de usuario: formulario de registro con validación client-side
 *     y envío a POST /auth/register
 *
 * Pendiente (agregar cuando los endpoints estén disponibles):
 *   - Listado de usuarios con filtros y paginación
 *   - Modificación de datos de un usuario
 *   - Baja (desactivación) de usuario
 */

import { requireAuth }     from '../core/authGuard.js';
import { usersService }    from '../services/usersService.js';

// ── Guard: requiere sesión activa ──────────────────────────────────────────
// TODO: reactivar antes de producción
// requireAuth();

// ── DOM refs ───────────────────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const registerForm  = document.getElementById('registerUserForm');
const formAlert     = document.getElementById('formAlert');
const formAlertTitle = document.getElementById('formAlertTitle');
const formAlertMsg  = document.getElementById('formAlertMsg');
const userCreatedCard = document.getElementById('userCreatedCard');
const userCreatedName = document.getElementById('userCreatedName');
const userCreatedId   = document.getElementById('userCreatedId');
const userCreatedLectorId = document.getElementById('userCreatedLectorId');
const btnSubmit     = document.getElementById('btnSubmitRegister');
const btnReset      = document.getElementById('btnResetForm');

// ── Sidebar toggle (mobile) ────────────────────────────────────────────────
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('admin-sidebar--open');
});

// Cerrar sidebar al hacer click fuera (mobile)
document.addEventListener('click', (e) => {
  if (
    sidebar?.classList.contains('admin-sidebar--open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('admin-sidebar--open');
  }
});

// ── Tab navigation ─────────────────────────────────────────────────────────
document.querySelectorAll('.users-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    document.querySelectorAll('.users-tab').forEach(t => t.classList.remove('users-tab--active'));
    document.querySelectorAll('.users-panel').forEach(p => p.classList.remove('users-panel--active'));

    tab.classList.add('users-tab--active');
    document.getElementById(`panel-${target}`)?.classList.add('users-panel--active');
  });
});

// ── Validación de campos ───────────────────────────────────────────────────
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);
  field?.classList.add('form-input--error');
  if (errorEl) errorEl.textContent = message;
}

function validateForm(data, confirmPassword) {
  let valid = true;

  if (!data.dni || !/^\d{7,8}$/.test(data.dni)) {
    showFieldError('dni', 'Debe tener 7 u 8 dígitos numéricos.');
    valid = false;
  }
  if (!data.nombre?.trim()) {
    showFieldError('nombre', 'El nombre es requerido.');
    valid = false;
  }
  if (!data.apellido?.trim()) {
    showFieldError('apellido', 'El apellido es requerido.');
    valid = false;
  }
  if (!data.fecha_nacimiento) {
    showFieldError('fecha_nacimiento', 'La fecha de nacimiento es requerida.');
    valid = false;
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showFieldError('email', 'Ingresá un email válido.');
    valid = false;
  }
  if (!data.telefono?.trim()) {
    showFieldError('telefono', 'El teléfono es requerido.');
    valid = false;
  }
  if (!data.password) {
    showFieldError('password', 'La contraseña es requerida.');
    valid = false;
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(data.password)) {
    showFieldError('password', 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
    valid = false;
  }
  if (data.password !== confirmPassword) {
    showFieldError('confirmPassword', 'Las contraseñas no coinciden.');
    valid = false;
  }

  return valid;
}

// ── Helpers de alerta inline ───────────────────────────────────────────────
function showAlert(type, title, message) {
  formAlert.className = `alert alert--${type}`;
  formAlertTitle.textContent = title;
  formAlertMsg.textContent = message;
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  formAlert.className = 'alert alert--hidden';
  formAlertTitle.textContent = '';
  formAlertMsg.textContent = '';
}

// ── Card de usuario creado ─────────────────────────────────────────────────
function showUserCreatedCard(result) {
  userCreatedName.textContent = result.fullName;
  userCreatedId.textContent = `#${result.userId}`;
  userCreatedLectorId.textContent = `#${result.lectorId}`;
  userCreatedCard.style.display = 'flex';
  userCreatedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideUserCreatedCard() {
  userCreatedCard.style.display = 'none';
}

// ── Submit del formulario de alta ──────────────────────────────────────────
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();
  clearFieldErrors();
  hideUserCreatedCard();

  const fd = new FormData(registerForm);
  const confirmPassword = fd.get('confirmPassword');

  const data = {
    dni:              fd.get('dni')?.trim(),
    nombre:           fd.get('nombre')?.trim(),
    apellido:         fd.get('apellido')?.trim(),
    fecha_nacimiento: fd.get('fecha_nacimiento'),
    email:            fd.get('email')?.trim(),
    telefono:         fd.get('telefono')?.trim(),
    password:         fd.get('password'),
    legajo:           fd.get('legajo')?.trim() || undefined,
    genero:           fd.get('genero') || undefined,
    cresta_id:        fd.get('cresta_id')?.trim() || undefined,
  };

  if (!validateForm(data, confirmPassword)) return;

  // Eliminar claves opcionales vacías antes de enviar
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

  try {
    const result = await usersService.register(data);
    showAlert('success', 'Usuario registrado exitosamente', `La cuenta de ${result.fullName} fue creada en el sistema.`);
    showUserCreatedCard(result);
    registerForm.reset();
  } catch (err) {
    if (err.status === 409) {
      const field = err.data?.error?.field;
      const msg = err.data?.error?.message ?? 'Ya existe un usuario registrado con ese DNI o email.';
      showAlert('error', 'Usuario ya existente', msg);
      if (field) showFieldError(field, msg);
    } else if (err.status === 400) {
      showAlert('error', 'Datos inválidos', err.data?.error?.message ?? 'Revisá los campos del formulario e intentá nuevamente.');
    } else if (err.status === 422) {
      const field = err.data?.error?.field;
      const msg = err.data?.error?.message ?? 'Error de validación.';
      showAlert('error', 'Error de validación', msg);
      if (field) showFieldError(field, msg);
    } else {
      showAlert('error', 'Error de conexión', 'No se pudo conectar con el servidor. Intentá nuevamente.');
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Registrar Usuario';
  }
});

// ── Reset del formulario ───────────────────────────────────────────────────
btnReset?.addEventListener('click', () => {
  registerForm?.reset();
  clearFieldErrors();
  hideAlert();
  hideUserCreatedCard();
});
