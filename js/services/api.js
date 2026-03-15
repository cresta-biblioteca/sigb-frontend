/**
 * HTTP Client — Capa base de comunicación con la API
 *
 * Único lugar en toda la app donde se llama a fetch().
 * Maneja de forma centralizada:
 *   - URL base de la API
 *   - Headers comunes (Content-Type, Authorization)
 *   - Serialización del body
 *   - Errores HTTP globales (401 con token → sesión expirada)
 *   - Respuestas vacías (204 No Content)
 *
 * Ninguna página ni service llama fetch() directamente; todos usan
 * los métodos de este objeto (api.get, api.post, etc.)
 *
 * Uso:
 *   import { api, ApiError } from './api.js';
 *   const data = await api.get('/books');
 *   const result = await api.post('/auth/login', { dni, password });
 */

const API_BASE_URL = 'http://localhost:8080/api/v1';

// ---------------------------------------------------------------------------
// Error tipado para respuestas HTTP no exitosas
// ---------------------------------------------------------------------------

/**
 * Error que representa una respuesta HTTP con status >= 400.
 * Diferencia errores de la API (ApiError) de errores de red (Error genérico).
 *
 * Propiedades:
 *   status  {number}      — Código HTTP (401, 404, 422, 500, etc.)
 *   message {string}      — Mensaje del backend o fallback genérico
 *   data    {object|null} — Body completo de la respuesta de error
 */
class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// HTTP Client
// ---------------------------------------------------------------------------

const api = {
  /**
   * Método base. Todos los shorthand (get, post, etc.) lo usan internamente.
   *
   * @param {string} endpoint   - Ruta relativa a API_BASE_URL (ej: '/auth/login')
   * @param {RequestInit} options - Opciones de fetch (method, body, headers, etc.)
   * @returns {Promise<any>}    - Body JSON de la respuesta, o null si es 204
   * @throws {ApiError}         - En respuestas HTTP no exitosas (status >= 400)
   * @throws {Error}            - En errores de red (sin conexión, timeout, etc.)
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Solo agrega Authorization si hay token
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Permite sobrescribir headers por request si es necesario
        ...options.headers,
      },
    };

    // Serializar body automáticamente si es un objeto JS
    if (config.body !== null && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // 401 con token activo → sesión expirada
    // Sin token → credenciales inválidas (ej: login fallido), dejar propagar
    if (response.status === 401 && token) {
      localStorage.removeItem('auth_token');
      window.location.href = '/index.html';
      return;
    }

    // 204 No Content → respuesta exitosa sin cuerpo
    if (response.status === 204) return null;

    // Intentar parsear el body siempre (puede ser error o éxito)
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        body?.message ?? `Error ${response.status}`,
        body,
      );
    }

    return body;
  },

  // Shorthand methods — equivalente a api.request con method pre-seteado
  get: (endpoint, opts) => api.request(endpoint, { method: 'GET', ...opts }),
  post: (endpoint, body, opts) => api.request(endpoint, { method: 'POST', body, ...opts }),
  put: (endpoint, body, opts) => api.request(endpoint, { method: 'PUT', body, ...opts }),
  patch: (endpoint, body, opts) => api.request(endpoint, { method: 'PATCH', body, ...opts }),
  delete: (endpoint, opts) => api.request(endpoint, { method: 'DELETE', ...opts }),
};

export { api, ApiError };
