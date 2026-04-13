/**
 * Reservations Service — Endpoints de reservas del lector autenticado
 *
 * Encapsula la lectura de reservas pendientes, la cancelación y el
 * enriquecimiento de artículos/libros asociados a cada reserva.
 */

import { api, ApiError } from './api.js';

// ---------------------------------------------------------------------------
// Helpers de normalización
// ---------------------------------------------------------------------------

// Normaliza respuestas que pueden venir como array directo o como { data, pagination }.
function normalizeReservationsResponse(response) {
  if (Array.isArray(response)) {
    return { data: response, pagination: null };
  }

  if (Array.isArray(response?.data)) {
    return {
      data: response.data,
      pagination: response.pagination ?? null,
    };
  }

  return {
    data: [],
    pagination: response?.pagination ?? null,
  };
}

// Normaliza recursos puntuales que pueden venir anidados en { data }.
function normalizeResource(response) {
  if (response?.data && !Array.isArray(response.data)) return response.data;
  return response;
}

// Construye query string omitiendo valores vacíos/undefined.
function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

// ---------------------------------------------------------------------------
// Helpers de deduplicación
// ---------------------------------------------------------------------------

// Elimina reservas duplicadas usando una clave estable por item.
function dedupeById(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = buildReservationKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Genera clave robusta: prioriza id y usa fallback por campos compuestos.
function buildReservationKey(item) {
  if (item?.id !== undefined && item?.id !== null) {
    return `id:${String(item.id)}`;
  }

  const articuloId = item?.articulo_id ?? item?.articuloId ?? 'na';
  const fechaInicio = item?.fecha_inicio ?? item?.fechaInicio ?? 'na';
  const fechaVencimiento = item?.fecha_vencimiento ?? item?.fechaVencimiento ?? 'na';

  return `fallback:${String(articuloId)}|${String(fechaInicio)}|${String(fechaVencimiento)}`;
}

// ---------------------------------------------------------------------------
// Service API
// ---------------------------------------------------------------------------
const reservationsService = {
  /**
   * Consulta reservas del lector autenticado con filtros opcionales.
   *
   * @param {{ page?: number, perPage?: number, estado?: string }} [options]
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyReservations(options = {}) {
    const queryString = buildQueryString({
      estado: options.estado,
      page: options.page ?? 1,
      per_page: options.perPage ?? 20,
    });

    const response = await api.get(`/lectores/me/reservas?${queryString}`, { cache: 'no-store' });
    return normalizeReservationsResponse(response);
  },

  /**
   * Retorna las reservas activas del lector autenticado.
   * En el backend, esto corresponde a las reservas en estado PENDIENTE.
   *
   * @param {{ page?: number, perPage?: number }} [options]
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyActive(options = {}) {
    return this.getMyReservations({ ...options, estado: 'PENDIENTE' });
  },

  /**
   * Retorna historial de reservas del lector.
   * Se calcula como: todas las reservas menos reservas activas.
   * Esto evita duplicados cuando el backend no aplica filtro de estado
   * o no devuelve el campo estado en el payload.
   *
   * @param {{ page?: number, perPage?: number }} [options]
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyHistory(options = {}) {
    // Se consultan ambas fuentes en paralelo para minimizar latencia.
    const [allReservations, activeReservations] = await Promise.all([
      this.getMyReservations(options),
      this.getMyActive(options).catch(() => ({ data: [] })),
    ]);

    const activeKeys = new Set((activeReservations.data ?? []).map((reservation) => buildReservationKey(reservation)));
    const historyData = dedupeById((allReservations.data ?? []).filter(
      (reservation) => !activeKeys.has(buildReservationKey(reservation))
    ));

    return {
      data: historyData,
      pagination: allReservations.pagination ?? null,
    };
  },

  /**
   * Cancela una reserva activa del lector.
   *
   * @param {string|number} reservationId
   * @returns {Promise<{ message?: string }>}
   */
  cancelReservation(reservationId) {
    // Acepta string/number y asegura un id seguro para la URL.
    const normalizedId = Number.parseInt(String(reservationId), 10);
    const safeId = Number.isNaN(normalizedId) ? String(reservationId).trim() : normalizedId;

    return api.patch(`/reservas/${safeId}/cancelar`, {});
  },

  /**
   * Obtiene los datos del artículo asociado a una reserva.
   * Intenta primero /libros/{id} y, si no existe, cae a /articulos/{id}.
   *
   * @param {string|number} articleId
   * @returns {Promise<object>}
   */
  async getArticleById(articleId) {
    const endpoints = [`/libros/${articleId}`, `/articulos/${articleId}`];
    let lastError = null;

    // Fallback progresivo: si no existe en libros (404), busca en articulos.
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        return normalizeResource(response);
      } catch (error) {
        lastError = error;

        if (!(error instanceof ApiError) || error.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError;
  },
};

export { reservationsService };
