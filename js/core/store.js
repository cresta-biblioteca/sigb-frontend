/**
 * Store — Estado global de autenticación
 *
 * Responsabilidad única: mantener y persistir la sesión del usuario.
 *
 * El token JWT se guarda en localStorage. El objeto `user` se obtiene
 * decodificando el payload del JWT (sin verificar firma, eso es tarea
 * del backend). Los claims exactos dependen de lo que el servidor incluya
 * en el token (ej: sub, nombre, apellido, rol, exp).
 *
 * Uso:
 *   import { store } from '../core/store.js';
 *   store.init();                     // rehidratar desde localStorage
 *   store.isLoggedIn();               // boolean
 *   store.getUser();                  // objeto con claims del JWT
 *   store.setSession(token);          // guardar sesión tras login exitoso
 *   store.clearSession();             // limpiar tras logout
 */

const store = {
  _state: {
    token: null,
    user: null,
  },

  /**
   * Rehidrata el store desde localStorage. (Rehidratar = cargar el token guardado y decodificarlo para obtener el user).
   * Llamar una vez al inicio de cada página antes de cualquier verificación.
   * @returns {typeof store} Retorna el propio store para encadenamiento.
   */
  init() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this._state.token = token;
      this._state.user = this._decodeToken(token);
    }
    return this;
  },

  /** @returns {string|null} */
  getToken() {
    return this._state.token;
  },

  /**
   * Retorna los claims del JWT decodificado.
   * Los campos disponibles dependen del backend (ej: id, nombre, rol, exp).
   * @returns {object|null}
   */
  getUser() {
    return this._state.user;
  },

  /**
   * Verifica si hay una sesión activa y no expirada.
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this._state.token && !this._isTokenExpired();
  },

  /**
   * Persiste el token en memoria y localStorage.
   * Decodifica automáticamente el payload para obtener los datos del usuario.
   * @param {string} token - JWT recibido del backend
   */
  setSession(token) {
    this._state.token = token;
    this._state.user = this._decodeToken(token);
    localStorage.setItem('auth_token', token);
  },

  /**
   * Elimina la sesión de memoria y localStorage.
   */
  clearSession() {
    this._state.token = null;
    this._state.user = null;
    localStorage.removeItem('auth_token');
  },

  // ---------------------------------------------------------------------------
  // Métodos privados
  // ---------------------------------------------------------------------------

  /**
   * Decodifica el payload del JWT (base64url → JSON).
   * No verifica la firma — esa responsabilidad es del backend en cada request.
   * @param {string} token
   * @returns {object|null}
   */
  _decodeToken(token) {
    try {
      const payload = token.split('.')[1];
      // base64url → base64 estándar
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  },

  /**
   * Verifica si el token tiene claim `exp` y si ya venció.
   * Si no hay claim exp, se considera válido.
   * @returns {boolean}
   */
  _isTokenExpired() {
    const exp = this._state.user?.exp;
    if (!exp) return false;
    // exp está en segundos, Date.now() en milisegundos
    return Date.now() / 1000 > exp;
  },
};

export { store };
