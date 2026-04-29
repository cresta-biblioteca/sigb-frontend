/**
 * UI Utilities — Estados visuales reutilizables
 *
 * Funciones puras que manipulan un contenedor para mostrar distintos estados.
 * No dependen de ningún service ni del store. Solo trabajan con el DOM.
 *
 * Uso habitual en page scripts:
 *
 *   import { showLoading, showError, setButtonLoading, resetButton } from '../components/ui.js';
 *
 *   showLoading(container);
 *   try {
 *     const data = await someService.getAll();
 *     renderData(container, data);
 *   } catch (e) {
 *     showError(container, e.message);
 *   }
 */

/**
 * Muestra un spinner de carga dentro de un contenedor.
 * Reemplaza el contenido actual del contenedor.
 *
 * @param {HTMLElement} container
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="ui-loading" role="status" aria-live="polite">
      <span class="ui-loading__spinner" aria-hidden="true"></span>
      <span>Cargando...</span>
    </div>
  `;
}

/**
 * Muestra un mensaje de error dentro de un contenedor.
 * Reemplaza el contenido actual del contenedor.
 *
 * @param {HTMLElement} container
 * @param {string} [message]
 */
function showError(container, message = 'Ocurrió un error inesperado.') {
  container.innerHTML = `
    <p class="ui-error" role="alert">${message}</p>
  `;
}

/**
 * Muestra un estado vacío (sin resultados) dentro de un contenedor.
 * Reemplaza el contenido actual del contenedor.
 *
 * @param {HTMLElement} container
 * @param {string} [message]
 */
function showEmpty(container, message = 'No hay resultados para mostrar.') {
  container.innerHTML = `
    <p class="ui-empty">${message}</p>
  `;
}

/**
 * Pone un botón de submit en estado de carga:
 * lo deshabilita y cambia su texto.
 * Guarda el texto original en btn._originalText para poder restaurarlo.
 *
 * @param {HTMLButtonElement} btn
 * @param {string} [loadingText]
 */
function setButtonLoading(btn, loadingText = 'Cargando...') {
  btn.disabled = true;
  btn._originalText = btn.textContent;
  btn.textContent = loadingText;
}

/**
 * Restaura un botón al estado normal luego de setButtonLoading.
 *
 * @param {HTMLButtonElement} btn
 */
function resetButton(btn) {
  btn.disabled = false;
  if (btn._originalText !== undefined) {
    btn.textContent = btn._originalText;
  }
}

export { showLoading, showError, showEmpty, setButtonLoading, resetButton };
