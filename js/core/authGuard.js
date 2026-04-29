/**
 * Auth Guard — Protección de rutas
 *
 * Provee dos funciones para controlar el acceso a páginas:
 *
 *   requireAuth()  → usar al inicio de páginas que requieren sesión activa
 *                    (dashboard, loans, readers, book-detail)
 *
 *   requireGuest() → usar en páginas que no deben verse si ya estás logueado
 *                    (actualmente no aplica, pero útil si se crea login.html)
 *
 * Ambas funciones inicializan el store internamente; no es necesario
 * llamar a store.init() por separado en la página si se usa un guard.
 *
 * Uso:
 *   import { requireAuth } from '../core/authGuard.js';
 *   requireAuth(); // primera línea del page script
 */

import { store } from './store.js';

/**
 * Redirige al home si no hay sesión activa.
 * Detiene la ejecución del script de la página hasta que haya sesión.
 *
 * @param {string} [redirectTo='/index.html']
 */
function requireAuth(redirectTo = '/index.html') {
  store.init();
  if (!store.isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

/**
 * Redirige al dashboard si ya hay una sesión activa.
 * Útil para páginas exclusivas de usuarios no autenticados.
 *
 * @param {string} [redirectTo='templates/dashboard.html']
 */
function requireGuest(redirectTo = 'templates/dashboard.html') {
  store.init();
  if (store.isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

export { requireAuth, requireGuest };
