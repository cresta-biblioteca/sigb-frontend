/**
 * Auth Service — Endpoints de autenticación
 *
 * Encapsula todos los calls a /auth/*.
 * No maneja estado (store), no toca el DOM. Solo habla con la API.
 *
 * Contratos según OpenAPI spec (endpoints-backend/endpoints.yml):
 *
 *   POST /auth/login
 *     Body:    { dni: string, password: string }
 *     200 OK:  { token: string }
 *     401:     { message: string }  — credenciales inválidas
 *
 *   POST /auth/logout
 *     Header:  Authorization: Bearer <token>
 *     200 OK:  { message: string }
 *     401:     sesión inválida (manejado globalmente por api.js)
 *
 *   POST /auth/register
 *     Body:    { dni, password, nombre, apellido, fecha_nacimiento, telefono, email, ... }
 *     201:     { userId, lectorId, fullName }
 *     400/409/422: errores de validación
 *
 * Uso:
 *   import { authService } from '../services/authService.js';
 *   const { token } = await authService.login({ dni, password });
 */

import { api } from './api.js';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const authService = {
  /**
   * Autentica al usuario con DNI y contraseña.
   * La sesión (store.setSession) la maneja el caller (page script),
   * no este service, para mantener el service sin efectos secundarios.
   *
   * @param {{ dni: string, password: string }} credentials
   * @returns {Promise<{ token: string }>}
   * @throws {ApiError} 401 si las credenciales son inválidas
   */
  login(credentials) {
    return api.post('/auth/login', credentials);
  },

  /**
   * Cierra la sesión en el backend.
   * Llamar store.clearSession() después en el caller.
   *
   * @returns {Promise<{ message: string } | null>}
   */
  logout() {
    return api.post('/auth/logout');
  },

  /**
   * Registra un nuevo usuario y su perfil de lector.
   *
   * @param {{
   *   dni: string,
   *   password: string,
   *   nombre: string,
   *   apellido: string,
   *   fecha_nacimiento: string,  // formato: YYYY-MM-DD
   *   telefono: string,
   *   email: string,
   *   legajo?: string,
   *   genero?: string,
   *   cresta_id?: string
   * }} data
   * @returns {Promise<{ userId: number, lectorId: number, fullName: string }>}
   * @throws {ApiError} 400 datos inválidos | 409 usuario ya existe | 422 error de negocio
   */
  register(data) {
    return api.post('/auth/register', data);
  },

  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * @param {{ current_password: string, new_password: string }} data
   * @returns {Promise<{ message: string }>} 
   */
  async changePassword(data) {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 204) return { message: 'Contraseña actualizada correctamente' };

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(body?.error?.message ?? body?.message ?? `Error ${response.status}`);
      error.status = response.status;
      error.data = body;
      throw error;
    }

    return body;
  },
};

export { authService };
