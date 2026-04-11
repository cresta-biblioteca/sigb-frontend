/**
 * Dashboard Page Script — Mi Cuenta
 *
 * Primera línea siempre: requireAuth(). Si no hay sesión, redirige antes
 * de que se ejecute cualquier otra cosa en esta página.
 *
 * Flujo:
 *   1. requireAuth()     → verifica sesión, redirige si no hay
 *   2. Secciones de datos (préstamos, reservas, historial, stats) se activarán
 *      de a una cuando los endpoints del backend estén disponibles.
 *
 * Contenedores en el HTML (todos con datos de muestra hasta que el endpoint esté listo):
 *   #statActiveLoans         — contador de préstamos activos
 *   #statActiveReservations  — contador de reservas activas
 *   #activeLoans             — tabla de préstamos vigentes
 *   #activeReservations      — lista de reservas activas
 *   #loanHistory             — historial de préstamos
 *   #reservationHistory      — historial de reservas
 */

import { requireAuth }          from '../core/authGuard.js';
import { store }                from '../core/store.js';
import { authService }          from '../services/authService.js';
import { Modal }                from '../components/modal.js';

// ---------------------------------------------------------------------------
// Guard — debe ser lo primero que corre en cualquier página protegida
// ---------------------------------------------------------------------------
requireAuth('../index.html');

// ---------------------------------------------------------------------------
// Estadísticas de cuenta
//
// TODO: reemplazar con datos reales cuando el endpoint esté disponible.
// Ejemplo de integración futura:
//
// import { accountService } from '../services/accountService.js';
// try {
//   const summary = await accountService.getMySummary();
//   document.getElementById('statActiveLoans').textContent        = summary.prestamosActivos;
//   document.getElementById('statActiveReservations').textContent = summary.reservasActivas;
// } catch {
//   // silenciar: los valores quedan en "—"
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Préstamos vigentes (#activeLoans)
//
// El HTML ya contiene datos de muestra para el diseño.
// TODO: reemplazar con fetch real cuando el endpoint esté disponible.
//
// import { loansService }       from '../services/loansService.js';
// import { renderActiveLoans }  from '../renderers/loanRenderer.js';
// import { showEmpty, showError } from '../components/ui.js';
//
// const activeLoansEl = document.getElementById('activeLoans');
// try {
//   const loans = await loansService.getMyActive();
//   if (loans.length === 0) {
//     showEmpty(activeLoansEl, 'No tenés préstamos activos en este momento.');
//   } else {
//     renderActiveLoans(activeLoansEl, loans);
//   }
// } catch {
//   showError(activeLoansEl, 'No se pudieron cargar los préstamos. Intentá recargar la página.');
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reservas activas (#activeReservations)
//
// El HTML ya contiene datos de muestra para el diseño.
// TODO: reemplazar con fetch real cuando el endpoint esté disponible.
//
// import { reservationsService }     from '../services/reservationsService.js';
// import { renderActiveReservations } from '../renderers/reservationRenderer.js';
//
// const activeReservationsEl = document.getElementById('activeReservations');
// try {
//   const reservations = await reservationsService.getMyActive();
//   if (reservations.length === 0) {
//     showEmpty(activeReservationsEl, 'No tenés reservas activas.');
//   } else {
//     renderActiveReservations(activeReservationsEl, reservations);
//   }
// } catch {
//   showError(activeReservationsEl, 'No se pudieron cargar las reservas.');
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Historial de préstamos (#loanHistory)
//
// El HTML ya contiene datos de muestra para el diseño.
// TODO: reemplazar con fetch real cuando el endpoint esté disponible.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Historial de reservas (#reservationHistory)
//
// El HTML ya contiene datos de muestra para el diseño.
// TODO: reemplazar con fetch real cuando el endpoint esté disponible.
// ---------------------------------------------------------------------------

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
        // Notificar al backend para que invalide el token
        await authService.logout();
      } catch {
        // Si el backend falla, igual limpiamos localmente.
        // El usuario no puede quedar "atrapado" por un error de red.
      } finally {
        store.clearSession();
        window.location.href = '../index.html';
      }
    },
  });
});
