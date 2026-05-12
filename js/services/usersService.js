/**
 * Users Service — Gestión de usuarios
 *
 * Centraliza los endpoints relacionados a la gestión de usuarios.
 * Se irán añadiendo métodos a medida que los endpoints estén disponibles.
 *
 * Contratos según OpenAPI spec (endpoints-backend/endpoints.yml):
 *
 *   POST /auth/register
 *     Body:  { dni, password, nombre, apellido, fecha_nacimiento,
 *              telefono, email, legajo?, genero?, cresta_id? }
 *     201:   { userId, lectorId, fullName }
 *     400:   { message, errors }  — datos inválidos
 *     409:   { message, field }    — DNI o email ya registrado
 *     422:   { message, field }   — error de negocio
 *
 * Uso:
 *   import { usersService } from '../services/usersService.js';
 *   const result = await usersService.register(data);
 */

import { api } from './api.js';

const usersService = {
  /**
   * Registra un nuevo usuario y su perfil de lector.
   *
   * @param {{
   *   dni: string,
   *   password: string,
   *   nombre: string,
   *   apellido: string,
   *   fecha_nacimiento: string,  // YYYY-MM-DD
   *   telefono: string,
   *   email: string,
   *   legajo?: string,
   *   genero?: string,
   *   cresta_id?: string
   * }} data
   * @returns {Promise<{ userId: number, lectorId: number, fullName: string }>}
   * @throws {ApiError} 400 | 409 | 422
   */
  register(data) {
    return api.post('/auth/register', data);
  },

  // TODO: listUsers()      → GET  /usuarios           (endpoint pendiente)
  // TODO: getUserById(id)  → GET  /usuarios/{id}       (endpoint pendiente)
  // TODO: updateUser(id)   → PATCH /usuarios/{id}      (endpoint pendiente)
  // TODO: deactivate(id)   → PATCH /usuarios/{id}/baja (endpoint pendiente)
};

export { usersService };
