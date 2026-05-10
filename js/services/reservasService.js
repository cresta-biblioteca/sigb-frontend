import { api } from './api.js';

/**
 * Reservas Service — Gestión de circulación
 */
const reservasService = {
  /**
   * Obtiene el listado paginado de reservas.
   * @param {number} page - Número de página (1-indexed)
   * @param {number} limit - Cantidad de registros por página
   * @param {string} estado - Estado de las reservas (opcional)
   * @returns {Promise<{ data: Array, total: number }>}
   */
  getReservas(page = 1, limit = 10, estado = 'todas', fechaDesde = '', fechaHasta = '') {
    let url = `/reservas?page=${page}&per_page=${limit}`;
    if (estado && estado !== 'todas') {
      url += `&estado=${estado}`;
    }
    if (fechaDesde) {
      url += `&fecha_desde=${fechaDesde}`;
    }
    if (fechaHasta) {
      url += `&fecha_hasta=${fechaHasta}`;
    }
    return api.get(url);
  },

  /**
   * Obtiene el detalle de una reserva por su ID.
   * @param {number} id - ID de la reserva
   * @returns {Promise<object>} Objeto de la reserva
   */
  getReservaById(id) {
    return api.get(`/reservas/${id}`);
  },

  aprobarReserva(id) {
    return api.post(`/reservas/${id}/aprobar`);
  },
  
  cancelarReserva(id) {
    return api.post(`/reservas/${id}/cancelar`);
  },

  rechazarReserva(id) {
    return api.patch(`/reservas/${id}/cancelar`);
  },
  
  marcarReservaVencida(id) {
    return api.post(`/reservas/${id}/vencer`);
  }
};

export { reservasService };
