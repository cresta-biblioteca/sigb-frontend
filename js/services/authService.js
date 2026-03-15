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
};

export { authService };
