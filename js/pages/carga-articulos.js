/**
 * Carga de Artículos — Page Script
 *
 * Maneja la carga de artículos del catálogo en el panel staff.
 *
 * Funcionalidad actual:
 *   - Carga manual de Libro: formulario completo contra POST /libros
 *   - Importación MARC21: sube el archivo (.mrc, .marc, .xml) al backend
 *     via POST /articulos/importar/marc21 — el parsing y persistencia
 *     ocurren íntegramente en el servidor
 *
 * Pendiente (agregar cuando los endpoints estén disponibles):
 *   - Tipos adicionales: Revista, CD/DVD, Material Especial, etc.
 */

import { store }            from '../core/store.js';
import { articulosService } from '../services/articulosService.js';

store.init();

// ── Guard (descomentar antes de producción) ─────────────────────────────────
// import { requireAuth } from '../core/authGuard.js';
// requireAuth();

// ── DOM refs — layout ────────────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// ── DOM refs — formulario manual ─────────────────────────────────────────────
const formAlert      = document.getElementById('formAlert');
const formAlertTitle = document.getElementById('formAlertTitle');
const formAlertMsg   = document.getElementById('formAlertMsg');

const articuloCreatedCard = document.getElementById('articuloCreatedCard');
const createdTitle        = document.getElementById('createdTitle');
const createdId           = document.getElementById('createdId');
const createdIsbn         = document.getElementById('createdIsbn');
const createdEditorial    = document.getElementById('createdEditorial');

const libroForm  = document.getElementById('libroForm');
const btnSubmit  = document.getElementById('btnSubmit');
const btnReset   = document.getElementById('btnReset');

const personasList  = document.getElementById('personasList');
const btnAddPersona = document.getElementById('btnAddPersona');

// ── DOM refs — MARC21 ────────────────────────────────────────────────────────
const marcDropzone    = document.getElementById('marcDropzone');
const marcFileInput   = document.getElementById('marcFile');
const btnSelectFile   = document.getElementById('btnSelectFile');
const marcFileSelected = document.getElementById('marcFileSelected');
const marcFileName    = document.getElementById('marcFileName');
const btnClearFile    = document.getElementById('btnClearFile');
const btnImportMarc   = document.getElementById('btnImportMarc');
const marcLoading     = document.getElementById('marcLoading');
const marcResults     = document.getElementById('marcResults');

// ── Estado ───────────────────────────────────────────────────────────────────
let personaCount = 0;
let marcSelectedFile = null;

// ── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('btnLogout')?.addEventListener('click', () => {
  store.clearSession();
  window.location.href = 'login.html';
});

// ── Sidebar toggle (mobile) ──────────────────────────────────────────────────
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('admin-sidebar--open');
});

document.addEventListener('click', (e) => {
  if (
    sidebar?.classList.contains('admin-sidebar--open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('admin-sidebar--open');
  }
});

// ── Tab navigation ───────────────────────────────────────────────────────────
document.querySelectorAll('.carga-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.carga-tab').forEach(t => t.classList.remove('carga-tab--active'));
    document.querySelectorAll('.carga-panel').forEach(p => p.classList.remove('carga-panel--active'));
    tab.classList.add('carga-tab--active');
    document.getElementById(`panel-${target}`)?.classList.add('carga-panel--active');
  });
});

// ── Carga de tipos de documento ──────────────────────────────────────────────
async function loadTiposDocumento() {
  const select = document.getElementById('tipo_documento_id');
  if (!select) return;

  try {
    const tipos = await articulosService.getTiposDocumento();
    select.innerHTML = '<option value="">— Seleccionar tipo —</option>';
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.codigo} — ${t.descripcion}`;
      select.appendChild(opt);
    });
  } catch {
    // Fallback: input numérico si el endpoint no responde
    const wrapper = select.closest('.form-group');
    if (wrapper) {
      wrapper.innerHTML = `
        <label class="form-label" for="tipo_documento_id">
          Tipo de Documento <span class="required">*</span>
        </label>
        <input type="number" id="tipo_documento_id" name="tipo_documento_id"
               class="form-input" placeholder="ID del tipo de documento" min="1">
        <span class="form-hint">Ingresá el ID manualmente (API no disponible)</span>
        <span class="field-error" id="tipo_documento_idError"></span>
      `;
    }
  }
}

loadTiposDocumento();

// ── Alertas inline ───────────────────────────────────────────────────────────
function showAlert(type, title, message) {
  formAlert.className = `alert alert--${type}`;
  formAlertTitle.textContent = title;
  formAlertMsg.textContent = message;
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  formAlert.className = 'alert alert--hidden';
  formAlertTitle.textContent = '';
  formAlertMsg.textContent = '';
}

// ── Card de artículo creado ──────────────────────────────────────────────────
function showCreatedCard(res) {
  createdTitle.textContent     = res.titulo ?? '—';
  createdId.textContent        = `#${res.id}`;
  createdIsbn.textContent      = res.isbn ?? '—';
  createdEditorial.textContent = res.editorial ?? '—';
  articuloCreatedCard.style.display = 'flex';
  articuloCreatedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideCreatedCard() {
  articuloCreatedCard.style.display = 'none';
}

// ── Validación ───────────────────────────────────────────────────────────────
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
}

function setFieldError(fieldId, msg) {
  document.getElementById(fieldId)?.classList.add('form-input--error');
  const errEl = document.getElementById(`${fieldId}Error`);
  if (errEl) errEl.textContent = msg;
}

function validateLibroForm(data) {
  let valid = true;

  if (!data.articulo.titulo?.trim()) {
    setFieldError('titulo', 'El título es requerido.');
    valid = false;
  }
  if (!data.articulo.anio_publicacion || isNaN(data.articulo.anio_publicacion)) {
    setFieldError('anio_publicacion', 'El año es requerido.');
    valid = false;
  } else {
    const anio = parseInt(data.articulo.anio_publicacion, 10);
    if (anio < 1000 || anio > new Date().getFullYear() + 1) {
      setFieldError('anio_publicacion', 'Ingresá un año válido.');
      valid = false;
    }
  }
  if (!data.articulo.tipo_documento_id) {
    setFieldError('tipo_documento_id', 'Seleccioná un tipo de documento.');
    valid = false;
  }

  return valid;
}

// ── Personas dinámicas ───────────────────────────────────────────────────────
function renderPersonaRow(index) {
  const row = document.createElement('div');
  row.className = 'persona-row';
  row.dataset.index = index;
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="persona_nombre_${index}">Nombre</label>
      <input type="text" id="persona_nombre_${index}" name="persona_nombre_${index}"
             class="form-input" placeholder="Ej: Juan" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label" for="persona_apellido_${index}">Apellido</label>
      <input type="text" id="persona_apellido_${index}" name="persona_apellido_${index}"
             class="form-input" placeholder="Ej: Pérez" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label" for="persona_rol_${index}">Rol</label>
      <select id="persona_rol_${index}" name="persona_rol_${index}" class="form-input">
        <option value="autor">Autor</option>
        <option value="editor">Editor</option>
        <option value="ilustrador">Ilustrador</option>
        <option value="compilador">Compilador</option>
        <option value="traductor">Traductor</option>
        <option value="coordinador">Coordinador</option>
        <option value="director">Director</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" style="visibility:hidden;">Quitar</label>
      <button type="button" class="persona-row__remove" title="Quitar persona">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  row.querySelector('.persona-row__remove').addEventListener('click', () => {
    row.remove();
    updatePersonasEmpty();
  });

  return row;
}

function updatePersonasEmpty() {
  const emptyEl = document.getElementById('personasEmpty');
  if (!emptyEl) return;
  emptyEl.style.display = personasList.querySelectorAll('.persona-row').length === 0 ? 'block' : 'none';
}

btnAddPersona?.addEventListener('click', () => {
  personasList.appendChild(renderPersonaRow(personaCount++));
  updatePersonasEmpty();
});

function collectPersonas() {
  const personas = [];
  personasList.querySelectorAll('.persona-row').forEach((row, orden) => {
    const idx      = row.dataset.index;
    const nombre   = document.getElementById(`persona_nombre_${idx}`)?.value.trim();
    const apellido = document.getElementById(`persona_apellido_${idx}`)?.value.trim();
    const rol      = document.getElementById(`persona_rol_${idx}`)?.value;
    if (nombre || apellido) {
      personas.push({ nombre: nombre ?? '', apellido: apellido ?? '', rol, orden });
    }
  });
  return personas;
}

function clearPersonas() {
  personasList.innerHTML = '';
  personaCount = 0;
  updatePersonasEmpty();
}

// ── Submit formulario manual ─────────────────────────────────────────────────
libroForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();
  clearErrors();
  hideCreatedCard();

  const fd = new FormData(libroForm);

  const anioRaw   = fd.get('anio_publicacion');
  const tipoRaw   = fd.get('tipo_documento_id');
  const paginasRaw = fd.get('paginas');
  const cduRaw    = fd.get('cdu');

  const payload = {
    articulo: {
      titulo:            fd.get('titulo')?.trim(),
      anio_publicacion:  anioRaw ? parseInt(anioRaw, 10) : null,
      tipo_documento_id: tipoRaw ? parseInt(tipoRaw, 10) : null,
      idioma:            fd.get('idioma')?.trim() || undefined,
      descripcion:       fd.get('descripcion')?.trim() || undefined,
    },
    libro: {
      isbn:                 fd.get('isbn')?.trim() || undefined,
      issn:                 fd.get('issn')?.trim() || undefined,
      paginas:              paginasRaw ? parseInt(paginasRaw, 10) : undefined,
      editorial:            fd.get('editorial')?.trim() || undefined,
      lugar_de_publicacion: fd.get('lugar_de_publicacion')?.trim() || undefined,
      edicion:              fd.get('edicion')?.trim() || undefined,
      cdu:                  cduRaw ? parseInt(cduRaw, 10) : undefined,
      titulo_informativo:   fd.get('titulo_informativo')?.trim() || undefined,
      dimensiones:          fd.get('dimensiones')?.trim() || undefined,
      ilustraciones:        fd.get('ilustraciones')?.trim() || undefined,
      serie:                fd.get('serie')?.trim() || undefined,
      numero_serie:         fd.get('numero_serie')?.trim() || undefined,
      notas:                fd.get('notas')?.trim() || undefined,
      pais_publicacion:     fd.get('pais_publicacion')?.trim() || undefined,
    },
  };

  const personas = collectPersonas();
  if (personas.length > 0) payload.libro.personas = personas;

  Object.keys(payload.articulo).forEach(k => payload.articulo[k] === undefined && delete payload.articulo[k]);
  Object.keys(payload.libro).forEach(k => payload.libro[k] === undefined && delete payload.libro[k]);

  if (!validateLibroForm(payload)) return;

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

  try {
    const result = await articulosService.crearLibro(payload);
    showAlert('success', 'Libro registrado exitosamente', `"${result.titulo}" fue agregado al catálogo.`);
    showCreatedCard(result);
    libroForm.reset();
    clearPersonas();
  } catch (err) {
    if (err.status === 400) {
      showAlert('error', 'Datos inválidos', err.data?.message ?? 'Revisá los campos del formulario.');
    } else if (err.status === 422) {
      showAlert('error', 'Error de validación', err.data?.message ?? 'Error de negocio en el servidor.');
    } else if (err.status === 409) {
      showAlert('error', 'Artículo ya existente', err.data?.message ?? 'Ya existe un artículo con ese ISBN.');
    } else {
      showAlert('error', 'Error de conexión', 'No se pudo conectar con el servidor. Intentá nuevamente.');
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fas fa-book-medical"></i> Registrar Libro';
  }
});

btnReset?.addEventListener('click', () => {
  libroForm?.reset();
  clearErrors();
  hideAlert();
  hideCreatedCard();
  clearPersonas();
});

// ═══════════════════════════════════════════════════════════════════════════
// MARC21 — Carga de archivo y envío al backend
// ═══════════════════════════════════════════════════════════════════════════

// ── Helpers de estado visual ─────────────────────────────────────────────────
function setMarcFile(file) {
  marcSelectedFile         = file;
  marcFileName.textContent = file.name;
  marcDropzone.hidden      = true;
  marcFileSelected.hidden  = false;
  marcResults.hidden       = true;
  marcResults.innerHTML    = '';
  if (btnImportMarc) btnImportMarc.disabled = false;
}

function clearMarcFile() {
  marcSelectedFile        = null;
  marcDropzone.hidden     = false;
  marcFileSelected.hidden = true;
  marcLoading.hidden      = true;
  marcResults.hidden      = true;
  marcResults.innerHTML   = '';
  if (marcFileInput)  marcFileInput.value   = '';
  if (btnImportMarc)  btnImportMarc.disabled = true;
}

// ── Drag & drop ──────────────────────────────────────────────────────────────
marcDropzone?.addEventListener('dragover', (e) => {
  e.preventDefault();
  marcDropzone.classList.add('marc-dropzone--drag-over');
});

marcDropzone?.addEventListener('dragleave', () => {
  marcDropzone.classList.remove('marc-dropzone--drag-over');
});

marcDropzone?.addEventListener('drop', (e) => {
  e.preventDefault();
  marcDropzone.classList.remove('marc-dropzone--drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelection(file);
});

marcDropzone?.addEventListener('click', (e) => {
  if (e.target !== btnSelectFile) marcFileInput?.click();
});

btnSelectFile?.addEventListener('click', (e) => {
  e.stopPropagation();
  marcFileInput?.click();
});

marcFileInput?.addEventListener('change', () => {
  const file = marcFileInput.files[0];
  if (file) handleFileSelection(file);
});

btnClearFile?.addEventListener('click', clearMarcFile);

// ── Validación del archivo ───────────────────────────────────────────────────
function handleFileSelection(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['mrc', 'marc', 'xml'];

  if (!allowed.includes(ext)) {
    alert(`Formato no soportado: ".${ext}"\nFormatos aceptados: .mrc, .marc, .xml`);
    return;
  }

  setMarcFile(file);
}

// ── Importación ──────────────────────────────────────────────────────────────
btnImportMarc?.addEventListener('click', async () => {
  if (!marcSelectedFile) return;

  btnImportMarc.disabled  = true;
  btnImportMarc.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
  marcLoading.hidden      = false;
  marcResults.hidden      = true;
  marcResults.innerHTML   = '';

  try {
    const result = await articulosService.importarMarc21(marcSelectedFile);
    renderImportResults(result);
  } catch (err) {
    renderImportError(err);
  } finally {
    btnImportMarc.disabled  = false;
    btnImportMarc.innerHTML = '<i class="fas fa-upload"></i> Importar';
    marcLoading.hidden      = true;
    marcResults.hidden      = false;
    marcResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

// ── Render resultados exitosos ────────────────────────────────────────────────
function renderImportResults(result) {
  const { importados = 0, total = 0, registros = [], errores = [] } = result;
  const hayErrores = errores.length > 0;
  const todoOk     = importados === total && !hayErrores;

  let html = `
    <div class="marc-results__summary marc-results__summary--${todoOk ? 'success' : 'partial'}">
      <div class="marc-results__summary-icon">
        <i class="fas fa-${todoOk ? 'check-circle' : 'exclamation-circle'}"></i>
      </div>
      <div>
        <p class="marc-results__summary-title">
          ${todoOk ? 'Importación completada' : 'Importación completada con advertencias'}
        </p>
        <p class="marc-results__summary-sub">
          <strong>${importados}</strong> de <strong>${total}</strong> registros importados
          ${hayErrores ? `· <strong>${errores.length}</strong> ${errores.length === 1 ? 'error' : 'errores'}` : ''}
        </p>
      </div>
    </div>
  `;

  if (registros.length > 0) {
    html += `
      <div class="marc-results__section">
        <p class="marc-results__section-title">
          <i class="fas fa-check"></i> Registros importados
        </p>
        <ul class="marc-results__list">
          ${registros.map(r => `
            <li class="marc-results__item marc-results__item--ok">
              <span class="marc-results__item-badge">${r.tipo ?? 'artículo'}</span>
              <span class="marc-results__item-title">${escHtml(r.titulo ?? 'Sin título')}</span>
              <span class="marc-results__item-id">ID #${r.id}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (errores.length > 0) {
    html += `
      <div class="marc-results__section">
        <p class="marc-results__section-title marc-results__section-title--error">
          <i class="fas fa-times-circle"></i> Errores
        </p>
        <ul class="marc-results__list">
          ${errores.map(e => `
            <li class="marc-results__item marc-results__item--error">
              <span class="marc-results__item-badge marc-results__item-badge--error">
                Reg. ${e.indice ?? '?'}
              </span>
              <span class="marc-results__item-title">
                ${e.titulo ? escHtml(e.titulo) + ' — ' : ''}${escHtml(e.mensaje)}
              </span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  html += `
    <div class="marc-results__actions">
      <button type="button" class="btn btn--outline" id="btnNewImport">
        <i class="fas fa-plus"></i> Nueva importación
      </button>
    </div>
  `;

  marcResults.innerHTML = html;
  document.getElementById('btnNewImport')?.addEventListener('click', clearMarcFile);
}

// ── Render error de red / servidor ───────────────────────────────────────────
function renderImportError(err) {
  const msg = err.status
    ? (err.data?.message ?? `Error ${err.status} del servidor`)
    : 'No se pudo conectar con el servidor. Verificá tu conexión.';

  marcResults.innerHTML = `
    <div class="marc-results__summary marc-results__summary--error">
      <div class="marc-results__summary-icon">
        <i class="fas fa-times-circle"></i>
      </div>
      <div>
        <p class="marc-results__summary-title">Error al importar</p>
        <p class="marc-results__summary-sub">${escHtml(msg)}</p>
      </div>
    </div>
    <div class="marc-results__actions">
      <button type="button" class="btn btn--outline" id="btnRetryImport">
        <i class="fas fa-redo"></i> Reintentar
      </button>
      <button type="button" class="btn btn--outline" id="btnNewImport">
        <i class="fas fa-plus"></i> Nuevo archivo
      </button>
    </div>
  `;
  document.getElementById('btnRetryImport')?.addEventListener('click', () => btnImportMarc?.click());
  document.getElementById('btnNewImport')?.addEventListener('click', clearMarcFile);
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
