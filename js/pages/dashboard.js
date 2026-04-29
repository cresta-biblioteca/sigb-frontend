/**
 * Dashboard Page Script — Panel de Gestión
 *
 * Panel del usuario para reservas y préstamos.
 *
 * Funcionalidad actual:
 *   - Reservas activas: carga desde /lectores/me/reservas?estado=PENDIENTE
 *   - Cancelación de reserva: ejecuta /reservas/{id}/cancelar
 *   - Historial de reservas: muestra un resumen de los últimos movimientos
 *   - Préstamos vigentes: carga desde /lectores/me/prestamos?estado=VIGENTE
 *   - Historial de préstamos: muestra los préstamos devueltos más recientes
 *
 * Flujo principal:
 *   1. requireAuth()
 *   2. loadActiveLoans()
 *   3. loadActiveReservations()
 *   4. loadLoanHistory()
 *   5. loadReservationHistory()
 *
 * Contenedores usados en el HTML:
 *   #statActiveLoans         — contador de préstamos vigentes
 *   #statActiveReservations  — contador de reservas activas
 *   #activeReservations      — lista de reservas activas
 *   #reservationHistory      — historial resumido de reservas
 */

import { requireAuth }          from '../core/authGuard.js';
import { store }                from '../core/store.js';
import { authService }          from '../services/authService.js';
import { reservationsService }   from '../services/reservationsService.js';
import { loansService }          from '../services/loansService.js';
import { ApiError }              from '../services/api.js';
import { Modal }                from '../components/modal.js';
import { showLoading, showError, showEmpty, setButtonLoading, resetButton } from '../components/ui.js';

// ── Guard ────────────────────────────────────────────────────────────────
requireAuth('../index.html');

// ── Estadísticas de cuenta ───────────────────────────────────────────────
// setStatsLoading() mantiene sincronizadas las tarjetas de préstamos y reservas.

// ── Préstamos vigentes (#activeLoans) ────────────────────────────────────
// Renderiza tabla y contador desde el endpoint del lector autenticado.

// ── Reservas activas (#activeReservations) ───────────────────────────────
// Carga reservas pendientes y enriquece título/autor por articleId.

const activeReservationsElement = document.getElementById('activeReservations');
const activeLoansElement = document.getElementById('activeLoans');
const loanHistoryElement = document.getElementById('loanHistory');
const reservationHistoryElement = document.getElementById('reservationHistory');
const statActiveLoansElement = document.getElementById('statActiveLoans');
const statActiveReservationsElement = document.getElementById('statActiveReservations');

activeReservationsElement?.addEventListener('click', handleActiveReservationsClick);

// ── Lazy Loading: Dos fases de carga ──────────────────────────────────
// Fase 1: Carga crítica (activos, stats) — bloquea renderización
// Fase 2: Carga diferida (historial) — se defiere para mejor rendimiento inicial

setStatsLoading(true);

// Carga inmediata: activos (lo que ve el usuario primero)
void Promise.all([
  loadActiveLoans(),
  loadActiveReservations(),
]).finally(() => {
  // Carga deferida: historial (menos visible, no es crítico en primer render)
  // setTimeout permite que el navegador renderice activos sin bloqueo
  setTimeout(() => {
    void loadLoanHistory();
    void loadReservationHistory();
  }, 300); // 300ms de delay es imperceptible pero mejora rendimiento
});

async function loadActiveLoans() {
  if (!activeLoansElement) return;

  showLoading(activeLoansElement);

  try {
    const loansResponse = await loansService.getMyActive();
    const loans = loansResponse.data ?? [];
    const activeLoansTotal = loansResponse.pagination?.total ?? loans.length;

    if (statActiveLoansElement) {
      statActiveLoansElement.textContent = String(activeLoansTotal);
    }

    if (loans.length === 0) {
      showEmpty(activeLoansElement, 'No tenés préstamos vigentes en este momento.');
      return;
    }

    activeLoansElement.innerHTML = renderActiveLoansTable(loans);
  } catch (error) {
    if (statActiveLoansElement) {
      statActiveLoansElement.textContent = '0';
    }

    if (isEmptyActiveLoansError(error)) {
      showEmpty(activeLoansElement, 'No tenés préstamos vigentes en este momento.');
      return;
    }

    const message = error instanceof ApiError
      ? 'No se pudieron cargar los préstamos vigentes.'
      : 'No se pudo conectar con el servidor. Intentá recargar la página.';

    showError(activeLoansElement, message);
  } finally {
    if (statActiveReservationsElement?.textContent?.trim()) {
      setStatsLoading(false);
    }
  }
}

async function loadActiveReservations() {
  if (!activeReservationsElement) return;

  setStatsLoading(true);
  showLoading(activeReservationsElement);

  try {
    const reservationsResponse = await reservationsService.getMyActive({
      page: 1,
      perPage: 20,
    });
    const reservations = reservationsResponse.data;
    const enrichedReservations = await reservationsService.enrichReservationsWithCache(reservations);
    const activeReservationsTotal = reservationsResponse.pagination?.total ?? enrichedReservations.length;

    if (statActiveReservationsElement) {
      statActiveReservationsElement.textContent = String(activeReservationsTotal);
    }

    if (enrichedReservations.length === 0) {
      showEmpty(activeReservationsElement, 'No tenés reservas activas en este momento.');
      return;
    }

    activeReservationsElement.innerHTML = renderReservationsList(enrichedReservations);
  } catch (error) {
    if (statActiveReservationsElement) {
      statActiveReservationsElement.textContent = '0';
    }

    const message = error instanceof ApiError
      ? 'No se pudieron cargar las reservas activas.'
      : 'No se pudo conectar con el servidor. Intentá recargar la página.';

    showError(activeReservationsElement, message);
  } finally {
    if (statActiveLoansElement?.textContent?.trim()) {
      setStatsLoading(false);
    }

    if (statActiveLoansElement && !statActiveLoansElement.textContent?.trim()) {
      statActiveLoansElement.textContent = '0';
    }
  }
}

async function handleActiveReservationsClick(event) {
  // Delegación de eventos: detecta clicks sobre botones de cancelar.
  const cancelButton = event.target.closest('[data-cancel-reservation]');

  if (!cancelButton || !activeReservationsElement.contains(cancelButton)) {
    return;
  }

  const reservationId = cancelButton.dataset.reservationId;

  if (!reservationId) {
    return;
  }

  Modal.create({
    title: 'Cancelar reserva',
    content: '¿Estás seguro que querés cancelar esta reserva activa?',
    onCancel: () => {},
    onConfirm: () => {
      void executeReservationCancellation(cancelButton, reservationId);
    },
  });
}

async function executeReservationCancellation(cancelButton, reservationId) {
  // Bloquea el botón mientras corre la request para evitar doble envío.
  setButtonLoading(cancelButton, 'Cancelando...');

  try {
    const response = await reservationsService.cancelReservation(reservationId);

    Modal.create({
      title: 'Reserva cancelada',
      content: response?.message ?? 'Reserva cancelada exitosamente',
    });

    await Promise.all([loadActiveReservations(), loadReservationHistory()]);
  } catch (error) {
    const message = error instanceof ApiError
      ? (error.data?.message ?? error.message ?? 'No se pudo cancelar la reserva.')
      : 'No se pudo conectar con el servidor. Intentá nuevamente.';

    Modal.create({
      title: 'No se pudo cancelar',
      content: message,
    });
  } finally {
    resetButton(cancelButton);
  }
}

async function loadReservationHistory() {
  if (!reservationHistoryElement) return;

  showLoading(reservationHistoryElement);

  try {
    const historyResponse = await reservationsService.getMyHistory({
      page: 1,
      perPage: 20,
    });
    // Enriquecemos y deduplicamos para evitar filas repetidas.
    const enrichedHistory = await reservationsService.enrichReservationsWithCache(historyResponse.data ?? []);
    const uniqueHistory = dedupeReservationHistoryForDisplay(enrichedHistory);

    const sortedHistory = [...uniqueHistory]
      .sort((a, b) => getReservationSortTimestamp(b) - getReservationSortTimestamp(a))
      .slice(0, 5);

    if (sortedHistory.length === 0) {
      showEmpty(reservationHistoryElement, 'Todavía no tenés reservas en el historial.');
      return;
    }

    reservationHistoryElement.innerHTML = renderReservationHistory(sortedHistory);
  } catch {
    showError(reservationHistoryElement, 'No se pudo cargar el historial de reservas.');
  }
}

async function loadLoanHistory() {
  if (!loanHistoryElement) return;

  showLoading(loanHistoryElement);

  try {
    const loansResponse = await loansService.getMyLoansEnriched();
    const loans = loansResponse.data ?? [];

    const returnedLoans = loans
      .filter(isReturnedLoanForHistory)
      .sort((a, b) => getLoanHistoryTimestamp(b) - getLoanHistoryTimestamp(a))
      .slice(0, 5);

    if (returnedLoans.length === 0) {
      showEmpty(loanHistoryElement, 'Todavía no tenés préstamos devueltos en el historial.');
      return;
    }

    loanHistoryElement.innerHTML = renderLoanHistory(returnedLoans);
  } catch (error) {
    if (isEmptyActiveLoansError(error)) {
      showEmpty(loanHistoryElement, 'Todavía no tenés préstamos devueltos en el historial.');
      return;
    }

    const message = error instanceof ApiError
      ? 'No se pudo cargar el historial de préstamos.'
      : 'No se pudo conectar con el servidor. Intentá recargar la página.';

    showError(loanHistoryElement, message);
  }
}

function dedupeReservationHistoryForDisplay(reservations) {
  const seen = new Set();

  return reservations.filter((reservation) => {
    const key = buildReservationHistoryDisplayKey(reservation);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReservationHistoryDisplayKey(reservation) {
  // Clave visual: si dos filas muestran lo mismo en UI, se consideran duplicadas.
  const statusInfo = getReservationHistoryStatusInfo(reservation);
  const statusDate = getReservationHistoryDate(reservation) || 'sin-fecha';
  const normalizedTitle = String(reservation?.title ?? '').trim().toLowerCase();

  return `${normalizedTitle}|${statusInfo.label}|${statusDate}`;
}

function setStatsLoading(isLoading) {
  // Mantiene ambos contadores sincronizados con el estado de carga.
  const statValues = [statActiveLoansElement, statActiveReservationsElement].filter(Boolean);

  statValues.forEach((element) => {
    if (isLoading) {
      element.classList.add('stat-card__value--loading');
      element.textContent = '';
      element.setAttribute('aria-busy', 'true');
      return;
    }

    element.classList.remove('stat-card__value--loading');
    element.removeAttribute('aria-busy');
  });
}

function renderReservationsList(reservations) {
  return `
    <ul class="reservation-list" aria-label="Reservas activas">
      ${reservations.map(renderReservationCard).join('')}
    </ul>
  `;
}

function renderReservationCard(reservation) {
  const reservationId = reservation.id ?? '';

  return `
    <li class="reservation-card" data-reservation-id="${escapeHtml(reservationId)}">
      <div class="reservation-card__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div class="reservation-card__info">
        <p class="reservation-card__title">${escapeHtml(reservation.title)}</p>
        <p class="reservation-card__meta">${escapeHtml(buildReservationMeta(reservation))}</p>
      </div>
      <button class="btn btn--danger btn--xs reservation-card__cancel" type="button" data-cancel-reservation data-reservation-id="${escapeHtml(reservationId)}" title="Cancelar reserva">
        Cancelar
      </button>
    </li>
  `;
}

function renderReservationHistory(reservations) {
  return `
    <ul class="history-list">
      ${reservations.map(renderReservationHistoryItem).join('')}
    </ul>
  `;
}

function renderReservationHistoryItem(reservation) {
  const statusInfo = getReservationHistoryStatusInfo(reservation);
  const statusDate = getReservationHistoryDate(reservation);
  const meta = statusDate ? `${statusInfo.label} el ${statusDate}` : statusInfo.label;

  return `
    <li class="history-item">
      <div class="history-item__info">
        <p class="history-item__title">${escapeHtml(reservation.title)}</p>
        <p class="history-item__meta">${escapeHtml(meta)}</p>
      </div>
      <span class="badge ${escapeHtml(statusInfo.badgeClass)}">${escapeHtml(statusInfo.label)}</span>
    </li>
  `;
}

function renderLoanHistory(loans) {
  return `
    <ul class="history-list">
      ${loans.map(renderLoanHistoryItem).join('')}
    </ul>
  `;
}

function renderLoanHistoryItem(loan) {
  const title = getLoanTitle(loan);
  const returnDate = formatLoanDate(getLoanReturnDate(loan));
  const meta = returnDate ? `Devuelto el ${returnDate}` : 'Devuelto';

  return `
    <li class="history-item">
      <div class="history-item__info">
        <p class="history-item__title">${escapeHtml(title)}</p>
        <p class="history-item__meta">${escapeHtml(meta)}</p>
      </div>
      <span class="badge badge--closed">Devuelto</span>
    </li>
  `;
}

function renderActiveLoansTable(loans) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead class="data-table__head">
          <tr>
            <th class="data-table__th" scope="col">Título</th>
            <th class="data-table__th" scope="col">Autor</th>
            <th class="data-table__th" scope="col">Código</th>
            <th class="data-table__th" scope="col">Prestado el</th>
            <th class="data-table__th" scope="col">Vence el</th>
            <th class="data-table__th data-table__th--center" scope="col">Acción</th>
          </tr>
        </thead>
        <tbody class="data-table__body">
          ${loans.map(renderActiveLoanRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderActiveLoanRow(loan) {
  const title = getLoanTitle(loan);
  const author = getLoanAuthor(loan) || 'Autor no disponible';
  const code = getLoanCode(loan) || '-';
  const startDate = formatLoanDate(getLoanStartDate(loan)) || '-';
  const dueDateRaw = getLoanDueDate(loan);
  const dueDate = formatLoanDate(dueDateRaw) || '-';
  const dueBadgeClass = getLoanDueBadgeClass(dueDateRaw);

  return `
    <tr class="data-table__row">
      <td class="data-table__td data-table__td--title">${escapeHtml(title)}</td>
      <td class="data-table__td">${escapeHtml(author)}</td>
      <td class="data-table__td data-table__td--code">${escapeHtml(code)}</td>
      <td class="data-table__td">${escapeHtml(startDate)}</td>
      <td class="data-table__td">
        <span class="badge ${escapeHtml(dueBadgeClass)}">${escapeHtml(dueDate)}</span>
      </td>
      <td class="data-table__td data-table__td--center">
        <button class="btn btn--primary btn--xs" type="button" disabled title="Renovación disponible próximamente">Renovar</button>
      </td>
    </tr>
  `;
}

function getLoanTitle(loan) {
  return loan?.title ?? 'Sin título';
}

function getLoanAuthor(loan) {
  return loan?.author ?? 'Autor no disponible';
}

function getLoanCode(loan) {
  return loan?.codigo
    ?? loan?.codigo_ejemplar
    ?? loan?.codigoEjemplar
    ?? loan?.inventario
    ?? loan?.articulo?.codigo
    ?? loan?.libro?.codigo
    ?? '';
}

function getLoanStartDate(loan) {
  return loan?.fecha_prestamo
    ?? loan?.fechaPrestamo
    ?? loan?.fecha_inicio
    ?? loan?.fechaInicio
    ?? loan?.created_at
    ?? loan?.createdAt
    ?? null;
}

function getLoanDueDate(loan) {
  return loan?.fecha_vencimiento
    ?? loan?.fechaVencimiento
    ?? loan?.due_date
    ?? loan?.dueDate
    ?? null;
}

function getLoanReturnDate(loan) {
  return loan?.fecha_devolucion
    ?? loan?.fechaDevolucion
    ?? loan?.fecha_fin
    ?? loan?.fechaFin
    ?? loan?.updated_at
    ?? loan?.updatedAt
    ?? null;
}

function formatLoanDate(rawDate) {
  if (!rawDate) return '';

  const parsedDate = parseBackendDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(rawDate);
  }

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

function getLoanDueBadgeClass(rawDate) {
  if (!rawDate) return 'badge--closed';

  const dueDate = parseBackendDate(rawDate);
  if (Number.isNaN(dueDate.getTime())) return 'badge--closed';

  const millisecondsInDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / millisecondsInDay);

  if (daysUntilDue < 0) return 'badge--overdue';
  if (daysUntilDue <= 3) return 'badge--warning';

  return 'badge--success';
}

function isReturnedLoanForHistory(loan) {
  const rawStatus = String(loan?.estado ?? loan?.status ?? '').toUpperCase();

  if (rawStatus.includes('COMPLETADO_EXITO') || rawStatus.includes('COMPLETADO_VENCIDO')) {
    return true;
  }

  if (rawStatus.includes('DEVUEL') || rawStatus.includes('FINAL')) {
    return true;
  }

  if (rawStatus === 'VIGENTE') {
    return false;
  }

  return Boolean(getLoanReturnDate(loan));
}

function getLoanHistoryTimestamp(loan) {
  const returnDate = getLoanReturnDate(loan);
  if (!returnDate) return 0;

  const parsedDate = parseBackendDate(returnDate);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  return parsedDate.getTime();
}

function isEmptyActiveLoansError(error) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.status === 404) {
    return true;
  }

  const backendMessage = String(error.data?.message ?? error.message ?? '').toLowerCase();

  return backendMessage.includes('no se encontraron prestamos')
    || backendMessage.includes('no se encontraron préstamos')
    || backendMessage.includes('sin prestamos')
    || backendMessage.includes('sin préstamos')
    || backendMessage.includes('no tiene prestamos')
    || backendMessage.includes('no tiene préstamos');
}

function getArticleId(reservation) {
  return reservation?.articulo_id
    ?? reservation?.articuloId
    ?? reservation?.article_id
    ?? reservation?.articleId
    ?? reservation?.libro_id
    ?? reservation?.libroId
    ?? null;
}

function getArticleTitle(article, reservation) {
  return article?.articulo?.titulo
    ?? article?.titulo
    ?? article?.title
    ?? reservation?.titulo
    ?? reservation?.title
    ?? 'Sin título';
}

function getArticleAuthor(article) {
  const author = article?.personas?.[0];

  if (typeof author === 'string') {
    return author;
  }

  if (author?.nombre && author?.apellido) {
    return `${author.nombre} ${author.apellido}`;
  }

  return article?.autor
    ?? article?.author
    ?? article?.persona
    ?? '';
}

function getReservationDate(reservation) {
  // Fecha base de la reserva (inicio/creación) con tolerancia a distintos contratos.
  const rawDate = reservation?.fecha_inicio
    ?? reservation?.fechaReserva
    ?? reservation?.created_at
    ?? reservation?.createdAt
    ?? reservation?.fecha
    ?? null;

  if (!rawDate) return '';

  const parsedDate = parseBackendDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(rawDate);
  }

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

function getReservationEndDate(reservation) {
  // Fecha de vencimiento de la reserva para mostrar en el meta de la card.
  const rawDate = reservation?.fecha_vencimiento
    ?? reservation?.fechaVencimiento
    ?? reservation?.due_date
    ?? null;

  if (!rawDate) return '';

  const parsedDate = parseBackendDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(rawDate);
  }

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

function getReservationHistoryDate(reservation) {
  // Selecciona la mejor fecha disponible para historial (cancelación, fin, update, etc.).
  const rawDate = reservation?.fecha_cancelacion
    ?? reservation?.fechaCancelacion
    ?? reservation?.fecha_fin
    ?? reservation?.fechaFin
    ?? reservation?.updated_at
    ?? reservation?.updatedAt
    ?? reservation?.fecha_vencimiento
    ?? reservation?.fechaVencimiento
    ?? reservation?.fecha_inicio
    ?? reservation?.fechaInicio
    ?? null;

  if (!rawDate) return '';

  const parsedDate = parseBackendDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(rawDate);
  }

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

function getReservationHistoryStatusInfo(reservation) {
  // Normaliza estados backend y deriva label + badge para render.
  const rawStatus = String(
    reservation?.estado
      ?? reservation?.status
      ?? ''
  ).toUpperCase();

  if (rawStatus.includes('CANCEL')) {
    return { label: 'Cancelada', badgeClass: 'badge--cancelled' };
  }

  if (rawStatus.includes('EXPIR')) {
    return { label: 'Vencida', badgeClass: 'badge--overdue' };
  }

  if (rawStatus.includes('COMPLET') || rawStatus.includes('FINAL') || rawStatus.includes('DEVUEL')) {
    return { label: 'Completada', badgeClass: 'badge--closed' };
  }

  const expiresAtRaw = reservation?.fecha_vencimiento ?? reservation?.fechaVencimiento ?? null;
  if (expiresAtRaw) {
    const expiresAtDate = parseBackendDate(expiresAtRaw);
    if (!Number.isNaN(expiresAtDate.getTime()) && expiresAtDate.getTime() < Date.now()) {
      return { label: 'Vencida', badgeClass: 'badge--overdue' };
    }
  }

  return { label: 'Cancelada', badgeClass: 'badge--cancelled' };
}

function getReservationSortTimestamp(reservation) {
  // Timestamp numérico para ordenar historial de más nuevo a más viejo.
  const rawDate = reservation?.fecha_cancelacion
    ?? reservation?.fechaCancelacion
    ?? reservation?.fecha_fin
    ?? reservation?.fechaFin
    ?? reservation?.updated_at
    ?? reservation?.updatedAt
    ?? reservation?.fecha_vencimiento
    ?? reservation?.fechaVencimiento
    ?? reservation?.fecha_inicio
    ?? reservation?.fechaInicio
    ?? null;

  if (!rawDate) return 0;

  const parsedDate = parseBackendDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  return parsedDate.getTime();
}

function buildReservationMeta(reservation) {
  // Arma texto secundario de la card (autor, fecha de reserva y vencimiento).
  const pieces = [];

  if (reservation.author) {
    pieces.push(reservation.author);
  } else {
    pieces.push('Autor no disponible');
  }

  const reservedAt = getReservationDate(reservation);
  if (reservedAt) {
    pieces.push(`Reservado el ${reservedAt}`);
  }

  const expiresAt = getReservationEndDate(reservation);
  if (expiresAt) {
    pieces.push(`Vence el ${expiresAt}`);
  }

  return pieces.join(' · ');
}

function parseBackendDate(value) {
  // Soporta formatos con espacio ("YYYY-MM-DD HH:mm:ss") o ISO con "T".
  const normalizedValue = String(value).includes(' ')
    ? String(value).replace(' ', 'T')
    : String(value);

  return new Date(normalizedValue);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ── Historial de préstamos (#loanHistory) ────────────────────────────────
// Muestra los préstamos devueltos más recientes.

// ── Historial de reservas (#reservationHistory) ──────────────────────────
// Muestra un resumen de las últimas reservas para acceso rápido.

// ── Logout ───────────────────────────────────────────────────────────────
const logoutButton = document.getElementById('logoutBtn');

logoutButton?.addEventListener('click', () => {
  Modal.create({
    title: 'Cerrar sesión',
    content: '¿Estás seguro que querés cerrar tu sesión?',
    onCancel: () => {},
    onConfirm: async () => {
      logoutButton.disabled = true;

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
