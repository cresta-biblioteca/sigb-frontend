/**
 * Lectores Service — Endpoints del lector autenticado
 *
 * Encapsula el acceso al perfil del lector autenticado.
 */

import { api } from './api.js';

const lectoresService = {
  /**
   * Obtiene el perfil del lector autenticado.
   * El backend responde con un envelope { data }.
   *
   * @returns {Promise<{ data: object } | object>}
   */
  getMyProfile() {
    return api.get('/lectores/mi-perfil');
  },
};

export { lectoresService };