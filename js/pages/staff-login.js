/**
 * Staff Login — Page Script
 *
 * Login exclusivo para el panel de administración.
 * Mismo endpoint que el login de lectores (POST /auth/login),
 * pero redirige a vista-general.html en lugar del dashboard de usuarios.
 *
 * Si ya hay sesión activa, redirige directamente a vista-general.html.
 */

import { store }       from '../core/store.js';
import { authService } from '../services/authService.js';
import { ApiError }    from '../services/api.js';

// ── Si ya hay sesión, ir directo al panel ──────────────────────────────────
store.init();
if (store.isLoggedIn()) {
  window.location.href = 'vista-general.html';
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const loginForm  = document.getElementById('staffLoginForm');
const dniInput   = document.getElementById('staffDni');
const pwdInput   = document.getElementById('staffPassword');
const submitBtn  = document.getElementById('staffLoginBtn');
const loginAlert = document.getElementById('loginAlert');
const alertMsg   = document.getElementById('loginAlertMsg');

// ── Helpers ────────────────────────────────────────────────────────────────
function showError(message) {
  alertMsg.textContent = message;
  loginAlert.classList.add('login-alert--visible');
}

function hideError() {
  loginAlert.classList.remove('login-alert--visible');
}

// ── Submit ─────────────────────────────────────────────────────────────────
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const dni      = dniInput?.value.trim();
  const password = pwdInput?.value;

  if (!dni || !password) {
    showError('Completá tu DNI y contraseña para continuar.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

  try {
    const { token } = await authService.login({ dni, password });
    store.setSession(token);
    window.location.href = 'vista-general.html';

  } catch (error) {
    const messages = {
      401: 'DNI o contraseña incorrectos.',
      500: 'El servidor no está disponible. Intentá más tarde.',
    };
    const msg = error instanceof ApiError
      ? (messages[error.status] ?? 'Error al iniciar sesión.')
      : 'No se pudo conectar con el servidor.';

    showError(msg);

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar al Panel';
  }
});
