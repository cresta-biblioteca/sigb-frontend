/**
 * Reservations Service — Endpoints de reservas del lector autenticado
 *
 * Encapsula la lectura de reservas pendientes, la cancelación y el
 * enriquecimiento de artículos/libros asociados a cada reserva.
 */

import { api, ApiError } from './api.js';

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

function normalizeResource(response) {
  if (response?.data && !Array.isArray(response.data)) return response.data;
  return response;
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

const reservationsService = {
  /**
   * Retorna las reservas activas del lector autenticado.
   * En el backend, esto corresponde a las reservas en estado PENDIENTE.
   *
   * @param {{ page?: number, perPage?: number }} [options]
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyActive(options = {}) {
    const queryString = buildQueryString({
      estado: 'PENDIENTE',
      page: options.page ?? 1,
      per_page: options.perPage ?? 20,
    });

    const response = await api.get(`/lectores/me/reservas?${queryString}`);
    return normalizeReservationsResponse(response);
  },

  /**
   * Cancela una reserva activa del lector.
   *
   * @param {string|number} reservationId
   * @returns {Promise<{ message?: string }>}
   */
  cancelReservation(reservationId) {
    return api.patch(`/reservas/${reservationId}/cancelar`);
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
