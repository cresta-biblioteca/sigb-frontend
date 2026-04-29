/**
 * Home Page Script
 *
 * Orquesta la lógica de la página de inicio:
 *   - Redirige al dashboard si ya hay sesión activa
 *   - Formulario de login → consume POST /auth/login
 *   - Formulario de búsqueda → navega al catálogo con query param
 *   - Botón de accesibilidad → alto contraste
 *   - Botón de chat → modal informativo
 *   - Botón de búsqueda en navbar → scroll al catálogo
 *
 * Patrón para cada feature nueva en esta página:
 *   1. Obtener el/los elementos del DOM
 *   2. Agregar el event listener
 *   3. Dentro del handler: llamar el service correspondiente
 *   4. Manejar éxito y error con Modal o ui.js
 */

import { store } from '../core/store.js';
import { authService } from '../services/authService.js';
import { ApiError } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { setButtonLoading, resetButton } from '../components/ui.js';

// ---------------------------------------------------------------------------
// Inicialización: si ya hay sesión activa, redirigir al dashboard
// ---------------------------------------------------------------------------
store.init();
if (store.isLoggedIn()) {
  window.location.href = 'templates/dashboard.html';
}

// Login form — POST /auth/login
const loginForm = document.getElementById('loginForm');
const loginDniInput = document.getElementById('loginDni');
const loginPwdInput = document.getElementById('loginPassword');
const submitBtn = document.getElementById('loginSubmitBtn');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dni = loginDniInput?.value.trim();
  const password = loginPwdInput?.value.trim();

  if (!dni || !password) {
    Modal.create({
      title: 'Campos requeridos',
      content: 'Completá tu DNI y contraseña para ingresar.',
    });
    return;
  }

  setButtonLoading(submitBtn, 'Ingresando...');

  try {
    const { token } = await authService.login({ dni, password });

    // Guardar sesión en store + localStorage
    store.setSession(token);

    window.location.href = 'templates/dashboard.html';

  } catch (error) {
    // Mensajes amigables por código de error
    const errorMessages = {
      401: 'DNI o contraseña incorrectos. Verificá tus datos e intentá de nuevo.',
      500: 'El servidor no está disponible en este momento. Intentá más tarde.',
    };

    const message = error instanceof ApiError
      ? (errorMessages[error.status] ?? error.message)
      : 'No se pudo conectar con el servidor. Verificá tu conexión.';

    Modal.create({ title: 'Error al ingresar', content: message });

  } finally {
    // Siempre restaurar el botón, haya éxito o error
    resetButton(submitBtn);
  }
});

// ---------------------------------------------------------------------------
// Search form — navega al catálogo con query param
// ---------------------------------------------------------------------------
const searchForm = document.getElementById('searchForm');

searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput')?.value.trim();
  if (query) {
    window.location.href = `templates/catalog.html?q=${encodeURIComponent(query)}`;
  }
});

// ---------------------------------------------------------------------------
// Accesibilidad — toggle alto contraste
// ---------------------------------------------------------------------------
const accessibilityBtn = document.getElementById('accessibilityBtn');

if (accessibilityBtn) {
  let highContrast = false;

  accessibilityBtn.addEventListener('click', () => {
    highContrast = !highContrast;
    document.body.classList.toggle('high-contrast', highContrast);
    document.documentElement.style.fontSize = highContrast ? '18px' : '16px';
  });
}

// ---------------------------------------------------------------------------
// Chat — modal informativo de contacto
// ---------------------------------------------------------------------------
const chatBtn = document.getElementById('chatBtn');

chatBtn?.addEventListener('click', () => {
  Modal.create({
    title: 'Chat de Ayuda',
    content: `
      <p>¿Necesitás ayuda? Podés contactarnos por los siguientes medios:</p>
      <ul style="margin-top: 0.75rem; padding-left: 1.25rem; list-style: disc;">
        <li style="margin-bottom: 0.25rem;">Email: biblioteca@cresta.edu.ar</li>
        <li style="margin-bottom: 0.25rem;">Teléfono: (02983) 43-1229</li>
        <li>Presencial: Maipú 270, Tres Arroyos</li>
      </ul>
    `,
  });
});

// ---------------------------------------------------------------------------
// Navbar search btn — scroll al catálogo y focus en el input
// ---------------------------------------------------------------------------
const navSearchBtn = document.querySelector('.navbar__search-btn');

navSearchBtn?.addEventListener('click', () => {
  const catalogSection = document.getElementById('catalogo');
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('searchInput')?.focus(), 500);
  }
});
