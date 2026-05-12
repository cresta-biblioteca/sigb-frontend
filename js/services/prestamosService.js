import { api } from './api.js';

/**
 * Préstamos Service — Gestión de circulación
 */
const prestamosService = {
  /**
   * Obtiene el listado paginado de préstamos.
   * @param {number} page - Número de página (1-indexed)
   * @param {number} limit - Cantidad de registros por página
   * @param {string} estado - Estado de los préstamos (opcional)
   * @returns {Promise<{ data: Array, total: number, page: number, per_page: number }>}
   */
  getPrestamos(page = 1, limit = 10, estado = 'todos', fechaDesde = '', fechaHasta = '') {
    let url = `/prestamos?page=${page}&per_page=${limit}`;
    if (estado && estado !== 'todos') {
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
   * Obtiene el detalle de un préstamo por su ID.
   * @param {number} id - ID del préstamo
   * @returns {Promise<object>} Objeto del préstamo
   */
  getPrestamoById(id) {
    return api.get(`/prestamos/${id}`);
  },

  getPrestamoByEjemplarId(ejemplar_id) {
    return api.get(`/prestamos/ejemplar/${ejemplar_id}`);
  },

  crearPrestamo(data) {
    return api.post(`/prestamos`, data);
  },

  getTiposPrestamos() {
    return api.get(`/tipos-prestamos`);
  },

  renovarPrestamo(id, data = null) {
    return api.patch(`/prestamos/${id}/renovar`, data);
  },
  
  marcarDevuelto(id) {
    return api.patch(`/prestamos/${id}/devolver`);
  },
  
  marcarPrestamoVencido(id) {
    return api.post(`/prestamos/${id}/vencer`);
  }
};

export { prestamosService };
