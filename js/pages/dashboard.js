/**
 * Dashboard Page Script
 *
 * Primera línea siempre: requireAuth(). Si no hay sesión, redirige antes
 * de que se ejecute cualquier otra cosa en esta página.
 *
 * Flujo:
 *   1. requireAuth()       → verifica sesión, redirige si no hay
 *   2. store.getUser()     → obtiene datos del usuario del JWT decodificado
 *   3. Renderiza el saludo con el nombre del usuario
 *   4. Carga los préstamos activos (cuando el endpoint esté disponible)
 *   5. Maneja el logout
 *
 * Para agregar más secciones a este dashboard:
 *   - Agregar el contenedor vacío en dashboard.html
 *   - Importar el service correspondiente
 *   - Hacer el fetch y llamar el renderer dentro de un try/catch
 */

import { requireAuth }            from '../core/authGuard.js';
import { store }                  from '../core/store.js';
import { authService }            from '../services/authService.js';
import { Modal }                  from '../components/modal.js';
import { showError, showEmpty }   from '../components/ui.js';

// ---------------------------------------------------------------------------
// Guard — debe ser lo primero que corre en cualquier página protegida
// ---------------------------------------------------------------------------
requireAuth('../index.html');

// A partir de acá, store ya fue inicializado por requireAuth()
const user = store.getUser();

// ---------------------------------------------------------------------------
// Nombre del usuario en navbar y bienvenida
//
// Los claims exactos del JWT dependen del backend.
// Ajustar los nombres de campo (nombre, apellido, etc.)
// cuando se conozca la estructura real del token.
// ---------------------------------------------------------------------------
const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Usuario';

const navUserName      = document.getElementById('navUserName');
const dashboardWelcome = document.getElementById('dashboardWelcome');

if (navUserName)      navUserName.textContent     = fullName;
if (dashboardWelcome) dashboardWelcome.textContent = `Bienvenido, ${fullName}`;

// ---------------------------------------------------------------------------
// Préstamos activos
//
// Por ahora muestra "sin préstamos" porque el endpoint no está disponible aún.
// Cuando esté listo, reemplazar el bloque comentado con el fetch real.
// ---------------------------------------------------------------------------
const activeLoansContainer = document.getElementById('activeLoans');

// TODO: reemplazar con fetch real cuando el endpoint esté disponible
// import { loansService } from '../services/loansService.js';
// import { renderLoanList } from '../renderers/loanRenderer.js';
//
// try {
//   const loans = await loansService.getMyActive();
//   if (loans.length === 0) {
//     showEmpty(activeLoansContainer, 'No tenés préstamos activos en este momento.');
//   } else {
//     renderLoanList(activeLoansContainer, loans);
//   }
// } catch (error) {
//   showError(activeLoansContainer, 'No se pudieron cargar los préstamos. Intentá recargar la página.');
// }

if (activeLoansContainer) {
  showEmpty(activeLoansContainer, 'No tenés préstamos activos en este momento.');
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn?.addEventListener('click', () => {
  Modal.create({
    title: 'Cerrar sesión',
    content: '¿Estás seguro que querés cerrar tu sesión?',
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
