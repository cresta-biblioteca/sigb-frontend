/**
 * Dashboard Page Script — Panel de Gestión
 *
 * Primera línea siempre: requireAuth(). Si no hay sesión, redirige antes
 * de que se ejecute cualquier otra cosa en esta página.
 *
 * Estado actual de integración:
 *   - Reservas activas: integrado con backend (/lectores/me/reservas?estado=PENDIENTE)
 *   - Cancelación de reserva: integrado (/reservas/{id}/cancelar)
 *   - Historial de reservas (resumen en dashboard): integrado
 *   - Préstamos activos/historial de préstamos: pendiente de endpoint dedicado
 *
 * Flujo principal:
 *   1. requireAuth()         → verifica sesión y redirige si no hay token
 *   2. loadActiveReservations() → carga y renderiza reservas activas
 *   3. loadReservationHistory() → carga y renderiza últimas reservas del historial
 *   4. setStatsLoading()     → maneja loading visual de tarjetas de estadísticas
 *
 * Contenedores usados en el HTML:
 *   #statActiveLoans         — contador (por ahora fallback en 0)
 *   #statActiveReservations  — contador de reservas activas
 *   #activeReservations      — lista de reservas activas
 *   #reservationHistory      — historial resumido de reservas
 */

import { requireAuth }          from '../core/authGuard.js';
import { store }                from '../core/store.js';
import { authService }          from '../services/authService.js';
import { reservationsService }   from '../services/reservationsService.js';
import { ApiError }              from '../services/api.js';
import { Modal }                from '../components/modal.js';
import { showLoading, showError, showEmpty, setButtonLoading, resetButton } from '../components/ui.js';

// ---------------------------------------------------------------------------
// Guard — debe ser lo primero que corre en cualquier página protegida
// ---------------------------------------------------------------------------
requireAuth('../index.html');

// ---------------------------------------------------------------------------
// Estadísticas de cuenta
//
// Estado actual:
// - Reservas activas: se actualiza con datos reales del backend.
// - Préstamos activos: aún sin endpoint dedicado; se mantiene fallback en 0.
//
// Nota: setStatsLoading() controla el estado visual de carga para ambas tarjetas.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Préstamos vigentes (#activeLoans)
//
// Estado actual:
// - No está integrado en este script porque el backend de préstamos no está disponible.
// - La tarjeta de estadísticas muestra 0 como valor de respaldo.
// - El render de la tabla/listado de préstamos queda pendiente para una siguiente etapa.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reservas activas (#activeReservations)
//
// Este bloque ya consume datos reales del backend.
// Carga las reservas en estado PENDIENTE, las enriquece con título/autor
// del artículo asociado y deduplica las llamadas por articleId/articulo_id.
// ---------------------------------------------------------------------------

const activeReservationsElement = document.getElementById('activeReservations');
const reservationHistoryElement = document.getElementById('reservationHistory');
const statActiveLoansElement = document.getElementById('statActiveLoans');
const statActiveReservationsElement = document.getElementById('statActiveReservations');

activeReservationsElement?.addEventListener('click', handleActiveReservationsClick);

setStatsLoading(true);
void loadActiveReservations();
void loadReservationHistory();

async function loadActiveReservations() {
  if (!activeReservationsElement) return;

  setStatsLoading(true);
  showLoading(activeReservationsElement);

  try {
    const reservationsResponse = await reservationsService.getMyActive({ page: 1, perPage: 20 });
    const reservations = reservationsResponse.data;
    const enrichedReservations = await enrichReservations(reservations);
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
    setStatsLoading(false);

    if (statActiveLoansElement && !statActiveLoansElement.textContent?.trim()) {
      statActiveLoansElement.textContent = '0';
    }
  }
}

async function handleActiveReservationsClick(event) {
  // Delegación de eventos: escucha un solo click en la lista y detecta
  // si el target real fue un botón de cancelar.
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
    const historyResponse = await reservationsService.getMyHistory({ page: 1, perPage: 20 });
    // Enriquecemos con título/autor y luego deduplicamos para evitar ítems repetidos.
    const enrichedHistory = await enrichReservations(historyResponse.data ?? []);
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

async function enrichReservations(reservations) {
  // Resuelve artículos por lote usando cache por articleId para minimizar llamadas repetidas.
  const uniqueArticleIds = [...new Set(
    reservations
      .map((reservation) => getArticleId(reservation))
      .filter((articleId) => articleId !== null && articleId !== undefined && articleId !== '')
  )];

  const articleCache = new Map();

  await Promise.all(uniqueArticleIds.map(async (articleId) => {
    try {
      articleCache.set(String(articleId), await reservationsService.getArticleById(articleId));
    } catch {
      articleCache.set(String(articleId), null);
    }
  }));

  return reservations.map((reservation) => {
    const articleId = getArticleId(reservation);
    const article = articleCache.get(String(articleId)) ?? null;

    return {
      ...reservation,
      article,
      articleId,
      title: getArticleTitle(article, reservation),
      author: getArticleAuthor(article),
      reservedAt: getReservationDate(reservation),
    };
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
    return { label: 'Expirada', badgeClass: 'badge--overdue' };
  }

  if (rawStatus.includes('COMPLET') || rawStatus.includes('FINAL') || rawStatus.includes('DEVUEL')) {
    return { label: 'Completada', badgeClass: 'badge--closed' };
  }

  const expiresAtRaw = reservation?.fecha_vencimiento ?? reservation?.fechaVencimiento ?? null;
  if (expiresAtRaw) {
    const expiresAtDate = parseBackendDate(expiresAtRaw);
    if (!Number.isNaN(expiresAtDate.getTime()) && expiresAtDate.getTime() < Date.now()) {
      return { label: 'Expirada', badgeClass: 'badge--overdue' };
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

// ---------------------------------------------------------------------------
// Historial de préstamos (#loanHistory)
//
// Pendiente de integración real: el backend de préstamos todavía no expone
// el endpoint necesario para renderizar este bloque.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Historial de reservas (#reservationHistory)
//
// Ya se carga con datos reales del backend y se muestra un resumen de las
// últimas reservas para acceso rápido desde el dashboard.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
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
