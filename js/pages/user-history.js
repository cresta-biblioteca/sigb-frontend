/**
 * User History Page Script
 *
 * Pantalla dedicada a historial completo del usuario.
 *
 * Funcionalidad actual:
 *   - Historial de reservas: paginado y con estados legibles
 *   - Historial de préstamos: muestra préstamos devueltos con título enriquecido
 */

import { requireAuth } from '../core/authGuard.js';
import { store } from '../core/store.js';
import { authService } from '../services/authService.js';
import { reservationsService } from '../services/reservationsService.js';
import { loansService } from '../services/loansService.js';
import { ApiError } from '../services/api.js';
import { Modal } from '../components/modal.js';
import { showLoading, showError, showEmpty } from '../components/ui.js';

// ── Guard ────────────────────────────────────────────────────────────────
requireAuth('../index.html');

// ── Referencias de DOM ───────────────────────────────────────────────────
const reservationsHistoryElement = document.getElementById('reservationHistoryPage');
const reservationsHistoryPrevBtn = document.getElementById('reservationHistoryPrev');
const reservationsHistoryNextBtn = document.getElementById('reservationHistoryNext');
const reservationsHistoryPageInfoElement = document.getElementById('reservationHistoryPageInfo');
const reservationsHistoryPaginationElement = document.getElementById('reservationHistoryPagination');
const loansHistoryElement = document.getElementById('loanHistoryPage');
const loansHistoryPrevBtn = document.getElementById('loanHistoryPrev');
const loansHistoryNextBtn = document.getElementById('loanHistoryNext');
const loansHistoryPageInfoElement = document.getElementById('loanHistoryPageInfo');
const loansHistoryPaginationElement = document.getElementById('loanHistoryPagination');
const logoutBtn = document.getElementById('logoutBtn');

const RESERVATION_HISTORY_PAGE_SIZE = 30;
const LOAN_HISTORY_PAGE_SIZE = 30;

let currentHistoryPage = 1;
let totalHistoryPages = 1;
let currentLoanHistoryPage = 1;
let totalLoanHistoryPages = 1;
let returnedLoansCache = [];
let hasLoadedLoanHistory = false;

// ── Eventos de paginación ────────────────────────────────────────────────
reservationsHistoryPrevBtn?.addEventListener('click', () => {
  if (currentHistoryPage > 1) {
    void loadReservationsHistoryPage(currentHistoryPage - 1);
  }
});

reservationsHistoryNextBtn?.addEventListener('click', () => {
  if (currentHistoryPage < totalHistoryPages) {
    void loadReservationsHistoryPage(currentHistoryPage + 1);
  }
});

loansHistoryPrevBtn?.addEventListener('click', () => {
  if (currentLoanHistoryPage > 1) {
    void loadLoanHistoryPage(currentLoanHistoryPage - 1);
  }
});

loansHistoryNextBtn?.addEventListener('click', () => {
  if (currentLoanHistoryPage < totalLoanHistoryPages) {
    void loadLoanHistoryPage(currentLoanHistoryPage + 1);
  }
});

// ── Lazy Loading: Dos fases de carga ──────────────────────────────────
// Fase 1: Historial de reservas (más visible, prioritario)
// Fase 2: Historial de préstamos se defiere para mejor rendimiento inicial

void loadReservationsHistoryPage(currentHistoryPage)
  .finally(() => {
    // Carga deferida del historial de préstamos tras completar reservas
    setTimeout(() => {
      void loadLoanHistoryPage(currentLoanHistoryPage);
    }, 250);
  });

// Carga una página del historial de reservas con estado loading/error/empty.
async function loadReservationsHistoryPage(page = 1) {
  if (!reservationsHistoryElement) return;

  currentHistoryPage = Math.max(1, page);
  showLoading(reservationsHistoryElement);
  setReservationHistoryPaginationLoading(true);

  try {
    const historyResponse = await reservationsService.getMyHistory({
      page: currentHistoryPage,
      perPage: RESERVATION_HISTORY_PAGE_SIZE,
    });
    const reservations = dedupeReservationsForDisplay(await enrichReservations(historyResponse.data ?? []));
    const sortedReservations = [...reservations].sort((a, b) => getReservationSortTimestamp(b) - getReservationSortTimestamp(a));
    const totalReservations = historyResponse.pagination?.total ?? sortedReservations.length;
    const calculatedTotalPages = historyResponse.pagination?.total_pages
      ?? Math.max(1, Math.ceil(totalReservations / RESERVATION_HISTORY_PAGE_SIZE));

    // Si el historial se calcula por diferencia (todas - activas), el total de
    // paginación del backend puede no coincidir con el historial resultante.
    // En ese caso, si la primera página ya trae menos que el tamaño de página,
    // ocultamos la paginación para no mostrar controles inútiles.
    totalHistoryPages = (currentHistoryPage === 1 && sortedReservations.length < RESERVATION_HISTORY_PAGE_SIZE)
      ? 1
      : calculatedTotalPages;

    if (sortedReservations.length === 0) {
      showEmpty(reservationsHistoryElement, 'Todavía no tenés reservas para mostrar en el historial.');
      updateReservationHistoryPaginationInfo();
      return;
    }

    reservationsHistoryElement.innerHTML = `
      <ul class="history-list">
        ${sortedReservations.map(renderReservationsHistoryItem).join('')}
      </ul>
    `;

    updateReservationHistoryPaginationInfo();
  } catch (error) {
    const message = error instanceof ApiError
      ? 'No se pudo cargar el historial de reservas.'
      : 'No se pudo conectar con el servidor. Intentá nuevamente.';

    showError(reservationsHistoryElement, message);
    totalHistoryPages = 1;
    updateReservationHistoryPaginationInfo();
  } finally {
    setReservationHistoryPaginationLoading(false);
  }
}

async function enrichReservations(reservations) {
  // Usa caché del servicio para obtener datos bibliográficos.
  const enrichedBase = await reservationsService.enrichReservationsWithCache(reservations);

  // Agrega propiedades específicas del contexto de historial.
  return enrichedBase.map((reservation) => ({
    ...reservation,
    historyLabel: getReservationHistoryLabel(reservation),
    historyDate: getReservationHistoryDate(reservation),
    historyTimestamp: getReservationHistoryTimestamp(reservation),
  }));
}

// Renderiza una fila del historial de reservas.
function renderReservationsHistoryItem(reservation) {
  return `
    <li class="history-item">
      <div class="history-item__info">
        <p class="history-item__title">${escapeHtml(reservation.title)}</p>
        <p class="history-item__meta">${escapeHtml(reservation.historyLabel)}${reservation.historyDate ? ` el ${escapeHtml(reservation.historyDate)}` : ''}${reservation.author ? ` · ${escapeHtml(reservation.author)}` : ''}</p>
      </div>
      <span class="badge ${escapeHtml(getReservationHistoryBadgeClass(reservation))}">${escapeHtml(reservation.historyLabel)}</span>
    </li>
  `;
}

// Actualiza controles de paginación (botones, texto y visibilidad).
function updateReservationHistoryPaginationInfo() {
  if (reservationsHistoryPaginationElement) {
    reservationsHistoryPaginationElement.hidden = totalHistoryPages <= 1;
  }

  if (reservationsHistoryPageInfoElement) {
    reservationsHistoryPageInfoElement.textContent = `Página ${currentHistoryPage} de ${totalHistoryPages}`;
  }

  if (reservationsHistoryPrevBtn) {
    reservationsHistoryPrevBtn.disabled = currentHistoryPage <= 1;
  }

  if (reservationsHistoryNextBtn) {
    reservationsHistoryNextBtn.disabled = currentHistoryPage >= totalHistoryPages;
  }
}

// Bloquea o desbloquea los botones de paginación durante la carga.
function setReservationHistoryPaginationLoading(isLoading) {
  if (reservationsHistoryPrevBtn) {
    reservationsHistoryPrevBtn.disabled = isLoading || currentHistoryPage <= 1;
  }

  if (reservationsHistoryNextBtn) {
    reservationsHistoryNextBtn.disabled = isLoading || currentHistoryPage >= totalHistoryPages;
  }
}

// Elimina duplicados de visualización para evitar ítems repetidos en pantalla.
function dedupeReservationsForDisplay(reservations) {
  const seen = new Set();

  return reservations.filter((reservation) => {
    const key = `${String(reservation.title ?? '').trim().toLowerCase()}|${String(reservation.historyLabel ?? '').trim().toLowerCase()}|${String(reservation.historyDate ?? '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Obtiene el ID del artículo soportando distintos nombres de campo del backend.
function getArticleId(reservation) {
  return reservation?.articulo_id
    ?? reservation?.articuloId
    ?? reservation?.article_id
    ?? reservation?.articleId
    ?? reservation?.libro_id
    ?? reservation?.libroId
    ?? null;
}

// Resuelve el título a mostrar con fallback entre libro/artículo/reserva.
function getArticleTitle(article, reservation) {
  return article?.articulo?.titulo
    ?? article?.titulo
    ?? article?.title
    ?? reservation?.titulo
    ?? reservation?.title
    ?? 'Sin título';
}

// Resuelve el autor a mostrar según la estructura disponible en la respuesta.
function getArticleAuthor(article) {
  const author = article?.personas?.[0];

  if (typeof author === 'string') return author;
  if (author?.nombre && author?.apellido) return `${author.nombre} ${author.apellido}`;

  return article?.autor ?? article?.author ?? article?.persona ?? '';
}

// Normaliza estado backend y lo traduce a una etiqueta legible en UI.
function getReservationHistoryLabel(reservation) {
  const rawStatus = String(reservation?.estado ?? reservation?.status ?? '').toUpperCase();

  if (rawStatus.includes('CANCEL')) return 'Cancelada';
  if (rawStatus.includes('EXPIR')) return 'Vencida';
  if (rawStatus.includes('COMPLET') || rawStatus.includes('FINAL') || rawStatus.includes('DEVUEL')) return 'Completada';

  const endDate = reservation?.fecha_vencimiento ?? reservation?.fechaVencimiento ?? null;
  if (endDate) {
    const parsedEndDate = parseApiDate(endDate);
    if (!Number.isNaN(parsedEndDate.getTime()) && parsedEndDate.getTime() < Date.now()) {
      return 'Vencida';
    }
  }

  return 'Cancelada';
}

// Calcula la fecha de referencia para mostrar en el historial.
function getReservationHistoryDate(reservation) {
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

  const parsedDate = parseApiDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return String(rawDate);

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

// Mapea la etiqueta de historial a la clase visual del badge.
function getReservationHistoryBadgeClass(reservation) {
  const label = getReservationHistoryLabel(reservation);
  if (label === 'Cancelada') return 'badge--cancelled';
  if (label === 'Vencida') return 'badge--overdue';
  return 'badge--closed';
}

// Devuelve timestamp numérico para ordenar historial de más nuevo a más viejo.
function getReservationSortTimestamp(reservation) {
  const rawDate = reservation?.historyTimestamp ?? reservation?.fecha_cancelacion ?? reservation?.fecha_vencimiento ?? reservation?.fecha_inicio ?? null;
  if (!rawDate) return 0;

  const parsedDate = parseApiDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  return parsedDate.getTime();
}

// Obtiene la fecha "más representativa" para histórico y ordenamiento.
function getReservationHistoryTimestamp(reservation) {
  return reservation?.fecha_cancelacion
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
}

// Parsea fechas backend permitiendo formatos con espacio o con 'T'.
function parseApiDate(value) {
  const normalizedValue = String(value).includes(' ')
    ? String(value).replace(' ', 'T')
    : String(value);

  return new Date(normalizedValue);
}

async function loadLoanHistoryPage(page = 1) {
  if (!loansHistoryElement) return;

  currentLoanHistoryPage = Math.max(1, page);
  showLoading(loansHistoryElement);
  setLoanHistoryPaginationLoading(true);

  try {
    if (!hasLoadedLoanHistory) {
      const loansResponse = await loansService.getMyLoansEnriched();
      const loans = loansResponse.data ?? [];

      returnedLoansCache = loans
        .filter(isReturnedLoanForHistory)
        .sort((a, b) => getLoanHistoryTimestamp(b) - getLoanHistoryTimestamp(a));

      hasLoadedLoanHistory = true;
    }

    const totalLoans = returnedLoansCache.length;
    totalLoanHistoryPages = Math.max(1, Math.ceil(totalLoans / LOAN_HISTORY_PAGE_SIZE));

    if (currentLoanHistoryPage > totalLoanHistoryPages) {
      currentLoanHistoryPage = totalLoanHistoryPages;
    }

    const returnedLoans = getLoanHistoryPageItems();

    if (returnedLoans.length === 0) {
      showEmpty(loansHistoryElement, 'Todavía no tenés préstamos devueltos para mostrar en el historial.');
      updateLoanHistoryPaginationInfo();
      return;
    }

    loansHistoryElement.innerHTML = `
      <ul class="history-list">
        ${returnedLoans.map(renderLoanHistoryItem).join('')}
      </ul>
    `;

    updateLoanHistoryPaginationInfo();
  } catch (error) {
    if (isEmptyLoansError(error)) {
      totalLoanHistoryPages = 1;
      updateLoanHistoryPaginationInfo();
      showEmpty(loansHistoryElement, 'Todavía no tenés préstamos devueltos para mostrar en el historial.');
      return;
    }

    const message = error instanceof ApiError
      ? 'No se pudo cargar el historial de préstamos.'
      : 'No se pudo conectar con el servidor. Intentá nuevamente.';

    totalLoanHistoryPages = 1;
    updateLoanHistoryPaginationInfo();
    showError(loansHistoryElement, message);
  } finally {
    setLoanHistoryPaginationLoading(false);
  }
}

function getLoanHistoryPageItems() {
  const start = (currentLoanHistoryPage - 1) * LOAN_HISTORY_PAGE_SIZE;
  const end = start + LOAN_HISTORY_PAGE_SIZE;
  return returnedLoansCache.slice(start, end);
}

function updateLoanHistoryPaginationInfo() {
  if (loansHistoryPaginationElement) {
    loansHistoryPaginationElement.hidden = totalLoanHistoryPages <= 1;
  }

  if (loansHistoryPageInfoElement) {
    loansHistoryPageInfoElement.textContent = `Página ${currentLoanHistoryPage} de ${totalLoanHistoryPages}`;
  }

  if (loansHistoryPrevBtn) {
    loansHistoryPrevBtn.disabled = currentLoanHistoryPage <= 1;
  }

  if (loansHistoryNextBtn) {
    loansHistoryNextBtn.disabled = currentLoanHistoryPage >= totalLoanHistoryPages;
  }
}

function setLoanHistoryPaginationLoading(isLoading) {
  if (loansHistoryPrevBtn) {
    loansHistoryPrevBtn.disabled = isLoading || currentLoanHistoryPage <= 1;
  }

  if (loansHistoryNextBtn) {
    loansHistoryNextBtn.disabled = isLoading || currentLoanHistoryPage >= totalLoanHistoryPages;
  }
}

function renderLoanHistoryItem(loan) {
  const title = getLoanTitle(loan);
  const returnDate = formatApiDate(getLoanReturnDate(loan));
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

function getLoanTitle(loan) {
  return loan?.title ?? 'Sin título';
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

function formatApiDate(rawDate) {
  if (!rawDate) return '';

  const parsedDate = parseApiDate(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return String(rawDate);

  return new Intl.DateTimeFormat('es-AR').format(parsedDate);
}

function getLoanHistoryTimestamp(loan) {
  const returnDate = getLoanReturnDate(loan);
  if (!returnDate) return 0;

  const parsedDate = parseApiDate(returnDate);
  if (Number.isNaN(parsedDate.getTime())) return 0;

  return parsedDate.getTime();
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

function isEmptyLoansError(error) {
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

// Sanitiza texto antes de inyectar HTML (previene XSS básico).
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

