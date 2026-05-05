/**
 * Catalog Page Script — Catálogo
 *
 * Orquesta la búsqueda y el render del catálogo.
 *
 * Flujo principal:
 *   1. Cargar todos los libros (paginado)
 *   2. Aplicar filtros y orden
 *   3. Renderizar vista (grid/list) + paginación
 *
 * Capas:
 *   - LibroService: comunicación HTTP
 *   - CatalogRenderer: UI
 */

import { LibroService } from '../services/libroService.js';

// ── Renderer ──────────────────────────────────────────────────────────────

/**
 * CatalogRenderer — Renderizado del catálogo
 * Encapsula toda la interacción con el DOM.
 */
class CatalogRenderer {
  /**
   * Constructor
   * 
   * IMPORTANTE: El Renderer NO tiene dependencia de state.
   * El Controller es responsable de pasar los datos necesarios.
   * Esto sigue el principio de Clean Architecture: inversión de dependencias.
   */
  constructor() {
    // Cachear referencias del DOM
    this.booksGrid = document.getElementById('booksGrid');
    this.resultsCount = document.getElementById('resultsCount');
    this.viewControlBtns = document.querySelectorAll('.catalog-view-btn');

    // Elementos de búsqueda simple
    this.simpleTituloInput = document.getElementById('simpleTituloInput');
    this.simpleIsbnInput = document.getElementById('simpleIsbnInput');
    this.simplePersonaInput = document.getElementById('simplePersonaInput');
    this.sortByFilter = document.getElementById('sortByFilter');
    this.sortDirFilter = document.getElementById('sortDirFilter');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.searchForm = document.getElementById('searchForm');

    // Elementos de búsqueda avanzada
    this.toggleAdvancedSearchBtn = document.getElementById('toggleAdvancedBtn');
    this.advancedSearchPopup = document.getElementById('advancedSearchPopup');
    this.closeAdvancedBtn = document.getElementById('closeAdvancedBtn');
    this.applyAdvancedBtn = document.getElementById('applyAdvancedBtn');
    this.searchModeBadge = document.getElementById('searchModeBadge');
    this.advIssn = document.getElementById('advIssn');
    this.advEditorial = document.getElementById('advEditorial');
    this.advIdioma = document.getElementById('advIdioma');
    this.advAnioPublicacion = document.getElementById('advAnioPublicacion');
    this.advTipo = document.getElementById('advTipo');
    this.advCdu = document.getElementById('advCdu');
    this.advLugarPublicacion = document.getElementById('advLugarPublicacion');
    this.advTituloInformativo = document.getElementById('advTituloInformativo');
    this.advPersona = document.getElementById('advPersona');
    this.advTemas = document.getElementById('advTemas');

    // Callbacks registrados
    this.onPageClickCallback = null;
    this.onSimpleSearchCallback = null;
    this.simpleSearchBound = false;
    this.bookSourcesCache = new WeakMap();

    this.simpleFilterFields = {
      titulo: { el: this.simpleTituloInput, defaultValue: '' },
      isbn: { el: this.simpleIsbnInput, defaultValue: '' },
      persona: { el: this.simplePersonaInput, defaultValue: '' },
      sortBy: { el: this.sortByFilter, defaultValue: 'titulo' },
      sortDir: { el: this.sortDirFilter, defaultValue: 'asc' }
    };

    this.advancedFilterFields = {
      issn: { el: this.advIssn, defaultValue: '' },
      editorial: { el: this.advEditorial, defaultValue: '' },
      idioma: { el: this.advIdioma, defaultValue: '' },
      anioPublicacion: { el: this.advAnioPublicacion, defaultValue: '' },
      tipo: { el: this.advTipo, defaultValue: '' },
      cdu: { el: this.advCdu, defaultValue: '' },
      lugarDePublicacion: { el: this.advLugarPublicacion, defaultValue: '' },
      tituloInformativo: { el: this.advTituloInformativo, defaultValue: '' },
      persona: { el: this.advPersona, defaultValue: '' },
      temas: { el: this.advTemas, defaultValue: '' }
    };
  }

  readFilters(fields) {
    return Object.entries(fields).reduce((acc, [key, { el, defaultValue }]) => {
      if (!el) {
        acc[key] = defaultValue;
        return acc;
      }
      acc[key] = typeof el.value === 'string' ? el.value.trim() : el.value;
      if (acc[key] === '') acc[key] = defaultValue;
      return acc;
    }, {});
  }

  getBookSources(libro) {
    if (!libro || typeof libro !== 'object') return [];
    if (this.bookSourcesCache.has(libro)) return this.bookSourcesCache.get(libro);
    const sources = [libro, libro?.articulo, libro?.libro, libro?.metadata].filter(Boolean);
    this.bookSourcesCache.set(libro, sources);
    return sources;
  }

  /**
    * Registra callback para búsqueda simple (submit del formulario)
    * @param {Function} callback - Función({titulo, isbn, persona, sortBy, sortDir})
   */
  onSimpleSearch(callback) {
    this.onSimpleSearchCallback = callback;
    if (!this.simpleSearchBound) {
      this.bindSimpleSearchListeners();
      this.simpleSearchBound = true;
    }
  }

  bindSimpleSearchListeners() {
    const runSearch = () => {
      if (this.onSimpleSearchCallback) {
        this.onSimpleSearchCallback(this.getSimpleFilters());
      }
    };

    const debouncedSearch = this.createDebouncedCallback(runSearch, 350);

    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runSearch();
      });
    }

    const simpleInputs = [
      this.simpleTituloInput,
      this.simpleIsbnInput,
      this.simplePersonaInput
    ].filter(Boolean);

    simpleInputs.forEach(input => {
      input.addEventListener('input', debouncedSearch);
    });

    if (this.sortByFilter) {
      this.sortByFilter.addEventListener('change', debouncedSearch);
    }

    if (this.sortDirFilter) {
      this.sortDirFilter.addEventListener('change', debouncedSearch);
    }
  }

  createDebouncedCallback(callback, delayMs) {
    let timeoutId = null;
    return (...args) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        callback(...args);
      }, delayMs);
    };
  }

  /**
   * Registra callback para búsqueda avanzada (submit del formulario avanzado)
    * @param {Function} callback - Función(advancedFilters)
   */
  onAdvancedSearch(callback) {
    if (this.applyAdvancedBtn) {
      this.applyAdvancedBtn.addEventListener('click', () => {
        callback(this.getAdvancedFilters());
      });
    }
    this.setupAdvancedPopup();
  }

  /**
   * Devuelve los filtros del formulario simple
   * @returns {Object} {search, category, sort}
   */
  getSimpleFilters() {
    return this.readFilters(this.simpleFilterFields);
  }

  /**
   * Devuelve los filtros del formulario avanzado
   * @returns {Object}
   */
  getAdvancedFilters() {
    return this.readFilters(this.advancedFilterFields);
  }

  /**
   * Configura los eventos del popup de búsqueda avanzada
   */
  setupAdvancedPopup() {
    // Estado inicial: modo simple visible y avanzada oculta
    this.closeAdvancedPopup();

    if (this.toggleAdvancedSearchBtn) {
      this.toggleAdvancedSearchBtn.setAttribute('aria-expanded', 'false');
    }

    if (this.toggleAdvancedSearchBtn) {
      this.toggleAdvancedSearchBtn.addEventListener('click', () => {
        if (this.advancedSearchPopup && this.advancedSearchPopup.style.display === 'block') {
          this.closeAdvancedPopup();
        } else {
          this.openAdvancedPopup();
        }
      });
    }

    if (this.closeAdvancedBtn) {
      this.closeAdvancedBtn.addEventListener('click', () => {
        this.closeAdvancedPopup();
      });
    }
  }

  /** Muestra el popup de búsqueda avanzada */
  openAdvancedPopup() {
    if (this.searchForm) {
      this.searchForm.classList.add('is-advanced-mode');
    }
    if (this.advancedSearchPopup) {
      this.advancedSearchPopup.classList.remove('is-hidden');
      this.advancedSearchPopup.style.display = 'block';
    }
    if (this.toggleAdvancedSearchBtn) {
      this.toggleAdvancedSearchBtn.setAttribute('aria-expanded', 'true');
      this.toggleAdvancedSearchBtn.textContent = 'Cambiar a busqueda simple';
    }
    if (this.searchModeBadge) {
      this.searchModeBadge.textContent = 'Modo: busqueda avanzada';
    }
    if (this.advIssn) {
      this.advIssn.focus();
    }
  }

  /** Oculta el popup de búsqueda avanzada */
  closeAdvancedPopup() {
    if (this.searchForm) {
      this.searchForm.classList.remove('is-advanced-mode');
    }
    if (this.advancedSearchPopup) {
      this.advancedSearchPopup.classList.add('is-hidden');
      this.advancedSearchPopup.style.display = 'none';
    }
    if (this.toggleAdvancedSearchBtn) {
      this.toggleAdvancedSearchBtn.setAttribute('aria-expanded', 'false');
      this.toggleAdvancedSearchBtn.textContent = 'Cambiar a busqueda avanzada';
    }
    if (this.searchModeBadge) {
      this.searchModeBadge.textContent = 'Modo: busqueda simple';
    }
  }

  /**
   * Registra callback para limpiar filtros
   * @param {Function} callback - Función()
   */
  onClearFilters(callback) {
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => {
        callback();
      });
    }
  }

  /**
   * Registra callback para cambio de vista (grid/list)
   * @param {Function} callback - Función(viewType)
   */
  onViewChange(callback) {
    this.viewControlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        callback(view);
      });
    });
  }

  /**
   * Registra callback para página anterior
   * @param {Function} callback - Función()
   */
  onPrevPage(callback) {
    const prevBtn = document.querySelector('.catalog-pagination__btn--prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', callback);
    }
  }

  /**
   * Registra callback para página siguiente
   * @param {Function} callback - Función()
   */
  onNextPage(callback) {
    const nextBtn = document.querySelector('.catalog-pagination__btn--next');
    if (nextBtn) {
      nextBtn.addEventListener('click', callback);
    }
  }

  /**
   * Registra callback para click en número de página
   * Será usado cuando se generen los botones de página
   * @param {Function} callback - Función(pageNumber)
   */
  setOnPageClick(callback) {
    this.onPageClickCallback = callback;
  }

  /**
   * Limpia los inputs de los filtros
   */
  clearFilterInputs() {
    Object.values(this.simpleFilterFields).forEach(({ el, defaultValue }) => {
      if (el) el.value = defaultValue;
    });
    Object.values(this.advancedFilterFields).forEach(({ el, defaultValue }) => {
      if (el) el.value = defaultValue;
    });
  }

  /**
   * Renderiza los libros en el grid/list
   * @param {Array} libros - Array de libros a mostrar
   * @param {Object} resultInfo - (Opcional) Información de resultados {total, startIndex, endIndex}
   */
  renderLibros(libros, resultInfo = {}) {
    if (!this.booksGrid) {
      console.warn('booksGrid element not found');
      return;
    }

    // Limpiar grid
    this.booksGrid.innerHTML = '';

    // Si no hay resultados
    if (!libros || libros.length === 0) {
      this.showNoResults();
      return;
    }

    const fragment = document.createDocumentFragment();

    // Renderizar cada libro
    libros.forEach((libro) => {
      const card = this.createBookCard(libro);
      fragment.appendChild(card);
    });

    this.booksGrid.appendChild(fragment);

    // Actualizar contador de resultados si se proporciona la información
    if (resultInfo.total !== undefined && resultInfo.startIndex !== undefined && resultInfo.endIndex !== undefined) {
      this.updateResultsCount(resultInfo.total, resultInfo.startIndex, resultInfo.endIndex);
    }
  }

  /**
   * Muestra mensaje cuando no hay resultados
   * @private
   */
  showNoResults() {
    this.booksGrid.innerHTML = `
      <div class="catalog-no-results" style="grid-column: 1 / -1; padding: 3rem; text-align: center; background-color: white; border-radius: 8px;">
        <p style="color: var(--color-gray-600); font-size: var(--font-size-lg);">No se encontraron libros con los criterios seleccionados.</p>
      </div>
    `;
  }

  /**
   * Crea una tarjeta de libro
   * @param {Object} libro - Objeto libro
   * @returns {HTMLElement} Article element
   */
  createBookCard(libro) {
    const article = document.createElement('article');
    article.className = 'catalog-book-card';
    const libroId = this.getBookId(libro);
    const title = this.getBookTitle(libro);
    const authorInfo = this.getBookAuthors(libro);
    const description = this.getBookDescription(libro);
    const availability = this.getAvailabilityInfoForBook(libro);
    const year = this.getBookYear(libro);
    const rating = this.getBookRating(libro);

    article.setAttribute('data-libro-id', libroId || '');

    const additionalInfo = this.buildAdditionalInfo(libro);

    article.innerHTML = `
      <div class="catalog-book-card__content">
        <span class="catalog-book-card__availability--${availability.class}">
          ${availability.text}
        </span>
        <h3 class="catalog-book-card__title">${this.escapeHtml(title)}</h3>
        ${authorInfo ? `<p class="catalog-book-card__author">${this.escapeHtml(authorInfo)}</p>` : ''}
        ${description ? `<p class="catalog-book-card__description">${this.escapeHtml(description)}</p>` : ''}
        
        ${additionalInfo}

        <div class="catalog-book-card__meta">
          ${this.buildRatingHtml(rating)}
          <span class="catalog-book-card__year">${year || 'S/A'}</span>
        </div>
        <div class="catalog-book-card__actions">
          <a href="book-detail.html?id=${encodeURIComponent(libroId || '')}" class="btn btn--primary catalog-book-detail-link">Ver Detalle</a>
        </div>
      </div>
    `;

    const detailLink = article.querySelector('.catalog-book-detail-link');
    if (detailLink) {
      detailLink.addEventListener('click', () => {
        this.saveSelectedBookForDetail(libro);
      });
    }

    return article;
  }

  buildRatingHtml(rating) {
    if (!rating) {
      return '<div class="catalog-book-card__rating"><span class="catalog-book-card__rating-value">Sin calificación</span></div>';
    }
    return `
      <div class="catalog-book-card__rating">
        <span class="catalog-book-card__stars">${this.renderStars(rating)}</span>
        <span class="catalog-book-card__rating-value">(${rating.toFixed(1)})</span>
      </div>
    `;
  }

  buildAdditionalInfo(libro) {
    const infoItems = [];
    const cdu = this.getBookField(libro, 'cdu');
    const tituloInformativo = this.getBookField(libro, 'titulo_informativo', 'tituloInformativo');
    if (cdu) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>CDU:</strong> ${this.escapeHtml(cdu)}</span>`);
    }
    if (tituloInformativo) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Info:</strong> ${this.escapeHtml(tituloInformativo)}</span>`);
    }
    if (Array.isArray(libro.colaboradores) && libro.colaboradores.length > 0) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Colaboradores:</strong> ${this.escapeHtml(libro.colaboradores.join(', '))}</span>`);
    }
    const locationText = this.getLocationText(libro);
    if (locationText) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Ubicación:</strong> ${this.escapeHtml(locationText)}</span>`);
    }

    return infoItems.length > 0
      ? `<div class="catalog-book-additional-info">${infoItems.join('')}</div>`
      : '';
  }

  getBookField(libro, ...keys) {
    const sources = this.getBookSources(libro);

    for (const source of sources) {
      for (const key of keys) {
        if (String(key).includes('.')) {
          const nestedValue = this.getNestedValue(source, key);
          if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
            return nestedValue;
          }
          continue;
        }
        const value = source[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }

    return '';
  }

  getNestedValue(object, path) {
    return String(path).split('.').reduce((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return current[segment];
    }, object);
  }

  getBookId(libro) {
    return this.getBookField(libro, 'id', 'libro_id', 'libroId', 'articleId', 'article_id', 'articulo_id', 'articuloId');
  }

  saveSelectedBookForDetail(libro) {
    try {
      sessionStorage.setItem('selectedBookForDetail', JSON.stringify(libro));
    } catch (error) {
      console.warn('No se pudo guardar el libro seleccionado para el detalle:', error);
    }
  }

  getBookTitle(libro) {
    return this.getBookField(libro, 'titulo', 'title');
  }

  getBookAuthors(libro) {
    const directAuthor = this.getBookField(libro, 'autor', 'author', 'autorInformativo');
    if (directAuthor) return directAuthor;

    const authors = this.getBookField(libro, 'autores', 'authors');
    if (Array.isArray(authors) && authors.length > 0) return this.getPersonListText(authors);

    const personas = this.getBookField(libro, 'personas');
    if (Array.isArray(personas) && personas.length > 0) return this.getPersonListText(personas, true);

    return '';
  }

  getBookDescription(libro) {
    return this.getBookField(libro, 'description', 'descripcion', 'resumen', 'articulo.descripcion');
  }

  getBookYear(libro) {
    return this.getBookField(libro, 'año', 'anio', 'anio_publicacion', 'anioPublicacion', 'publicationYear', 'year');
  }

  getAvailabilityInfoForBook(libro) {
    const availability = this.getBookField(libro, 'disponibilidad', 'estado') || 'available';
    return this.getAvailabilityInfo(availability);
  }

  getBookRating(libro) {
    const rating = this.getBookField(libro, 'rating', 'calificacion');
    const numericRating = Number(rating);
    return Number.isFinite(numericRating) ? numericRating : null;
  }

  getPersonListText(personas, onlyAuthors = false) {
    return personas
      .filter(person => (onlyAuthors ? this.isAuthorPerson(person) : true))
      .map(person => this.formatPersonName(person))
      .filter(Boolean)
      .join(', ');
  }

  formatPersonName(person) {
    if (typeof person === 'string') return person.trim();
    if (!person || typeof person !== 'object') return '';

    const nombreCompleto = person.nombre_completo || person.nombreCompleto;
    if (nombreCompleto) return String(nombreCompleto).trim();

    const nombre = String(person.nombre || person.firstName || '').trim();
    const apellido = String(person.apellido || person.lastName || '').trim();

    if (nombre && apellido) return `${apellido}, ${nombre}`;
    return apellido || nombre || '';
  }

  isAuthorPerson(person) {
    const role = String(person?.rol || person?.role || person?.tipo || '').toLowerCase();
    return role.includes('autor') || role.includes('coautor');
  }

  /**
   * Obtiene la ubicación en formato legible
   * @param {Object} libro - Objeto libro
   * @returns {string} Ubicación formateada
   */
  getLocationText(libro) {
    const ubicacion = libro.ubicacion || {};
    const ciudad = ubicacion.ciudad || libro.ciudad;
    const calle = ubicacion.calle || libro.calle;
    const numero = ubicacion.numero || ubicacion.altura || libro.numero || libro.altura;

    const parts = [ciudad, calle, numero].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  /**
   * Renderiza las estrellas de calificación
   * @param {number} rating - Calificación (0-5)
   * @returns {string} Caracteres de estrellas
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar && fullStars < 5) {
      stars += '☆';
    }
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
  }

  /**
   * Obtiene información de disponibilidad
   * @param {string} availability - Estado de disponibilidad
   * @returns {Object} {class, text}
   */
  getAvailabilityInfo(availability) {
    const map = {
      'available': { class: 'available', text: 'Disponible' },
      'unavailable': { class: 'unavailable', text: 'No Disponible' },
      'digital': { class: 'digital', text: 'Digital' }
    };
    return map[availability] || { class: 'available', text: 'Disponible' };
  }

  /**
   * Actualiza el estado visual del botón de favorito
   * @param {string} libroId - ID del libro
   * @param {HTMLElement} button - Elemento del botón
   */

  /**
   * Actualiza el contador de resultados
   * @param {number} total - Total de libros encontrados
   * @param {number} startIndex - Índice del primer libro en la página actual
   * @param {number} endIndex - Índice del último libro en la página actual
   */
  updateResultsCount(total, startIndex, endIndex) {
    if (!this.resultsCount) return;

    const from = total === 0 ? 0 : startIndex;
    const to = Math.min(endIndex, total);

    if (total === 0) {
      this.resultsCount.textContent = 'No se encontraron resultados';
    } else {
      this.resultsCount.textContent = `Mostrando ${from}-${to} de ${total} libros`;
    }
  }

  /**
   * Actualiza la paginación
   * @param {Object} paginationData - Datos necesarios para renderizar paginación
   *   @param {number} paginationData.totalPages - Total de páginas
   *   @param {number} paginationData.currentPage - Página actual (1-indexed)
   */
  updatePagination(paginationData) {
    const { totalPages, currentPage } = paginationData;
    const paginationList = document.querySelector('.catalog-pagination__list');
    const prevBtn = document.querySelector('.catalog-pagination__btn--prev');
    const nextBtn = document.querySelector('.catalog-pagination__btn--next');
    const pagination = document.querySelector('.catalog-pagination');

    if (!paginationList) return;

    const setNavDisabled = (disabled) => {
      if (prevBtn) prevBtn.disabled = disabled || currentPage === 1;
      if (nextBtn) nextBtn.disabled = disabled || currentPage === totalPages;
    };

    // Ocultar paginación si hay 1 o menos páginas
    if (pagination) {
      pagination.classList.toggle('catalog-pagination--hidden', totalPages <= 1);
    }

    if (totalPages <= 1) {
      paginationList.innerHTML = '';
      setNavDisabled(true);
      return;
    }

    // Limpiar paginación anterior
    paginationList.innerHTML = '';

    const addEllipsis = () => {
      const ellipsis = document.createElement('li');
      ellipsis.className = 'catalog-pagination__ellipsis';
      ellipsis.textContent = '...';
      paginationList.appendChild(ellipsis);
    };

    const addPageRange = (start, end) => {
      for (let i = start; i <= end; i++) {
        this.createPageButton(i, paginationList, currentPage);
      }
    };

    if (totalPages <= 5) {
      addPageRange(1, totalPages);
    } else {
      this.createPageButton(1, paginationList, currentPage);

      if (currentPage > 3) addEllipsis();

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      addPageRange(start, end);

      if (currentPage < totalPages - 2) addEllipsis();

      this.createPageButton(totalPages, paginationList, currentPage);
    }

    setNavDisabled(false);
  }

  /**
   * Crea un botón de página individual
   * @private
   * @param {number} pageNumber - Número de página
   * @param {HTMLElement} container - Contenedor
   * @param {number} currentPage - Página actual para marcar como activa
   */
  createPageButton(pageNumber, container, currentPage) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'catalog-pagination__page';
    button.textContent = pageNumber;
    
    if (pageNumber === currentPage) {
      button.classList.add('catalog-pagination__page--active');
    }

    // Usar el callback registrado si existe
    if (this.onPageClickCallback) {
      button.addEventListener('click', () => {
        this.onPageClickCallback(pageNumber);
      });
    }

    li.appendChild(button);
    container.appendChild(li);
  }

  /**
   * Cambia la vista (grid/list)
   * @param {string} view - 'grid' o 'list'
   */
  changeView(view) {
    // Actualizar botones activos
    this.viewControlBtns.forEach(btn => {
      btn.classList.remove('catalog-view-btn--active');
      btn.setAttribute('aria-pressed', 'false');
      if (btn.dataset.view === view) {
        btn.classList.add('catalog-view-btn--active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });

    // Cambiar clase del grid
    if (this.booksGrid) {
      if (view === 'list') {
        this.booksGrid.classList.add('catalog-books-grid--list');
      } else {
        this.booksGrid.classList.remove('catalog-books-grid--list');
      }
    }
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   */
  showErrorMessage(message) {
    if (this.booksGrid) {
      this.booksGrid.innerHTML = `
        <div class="catalog-error" style="grid-column: 1 / -1; padding: 2rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
          <p>${this.escapeHtml(message)}</p>
          <button onclick="location.reload()" class="btn btn--primary" style="margin-top: 1rem;">Reintentar</button>
        </div>
      `;
    }
  }

  /**
   * Escapa caracteres HTML para evitar XSS
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

// ── Controller ───────────────────────────────────────────────────────────

class CatalogController {
  constructor(service, renderer) {
    this.service = service;
    this.renderer = renderer;

    this.allLibros = [];
    this.filteredLibros = [];
    this.totalLibros = 0;
    this.hasLoadedAllBooks = false;
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.currentView = 'grid';
    this.filters = {
      titulo: '',
      isbn: '',
      persona: '',
      sortBy: 'titulo',
      sortDir: 'asc',
      advanced: this.getDefaultAdvancedFilters()
    };
    this.lastRenderKey = '';

    this.init();
  }

  getDefaultAdvancedFilters() {
    return {
      issn: '',
      editorial: '',
      idioma: '',
      anioPublicacion: '',
      tipo: '',
      cdu: '',
      lugarDePublicacion: '',
      tituloInformativo: '',
      persona: '',
      temas: ''
    };
  }

  async init() {
    try {
      console.log('🚀 Inicializando catálogo...');
      this.setupEventListeners();
      await this.loadAllBooksAndRender();
      console.log('✅ Catálogo inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar el catálogo:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
  }

  async loadAllBooksAndRender() {
    const result = await this.service.loadAllLibros();

    if (result.cancelled) {
      return;
    }

    this.allLibros = Array.isArray(result.libros) ? result.libros : [];
    this.hasLoadedAllBooks = true;
    this.currentPage = 1;

    await this.applyFiltersAndRender();
  }

  setupEventListeners() {
    this.renderer.onSimpleSearch((simpleFilters) => {
      if (simpleFilters.titulo !== undefined) this.filters.titulo = simpleFilters.titulo;
      if (simpleFilters.isbn !== undefined) this.filters.isbn = simpleFilters.isbn;
      if (simpleFilters.persona !== undefined) this.filters.persona = simpleFilters.persona;
      if (simpleFilters.sortBy !== undefined) this.filters.sortBy = simpleFilters.sortBy;
      if (simpleFilters.sortDir !== undefined) this.filters.sortDir = simpleFilters.sortDir;
      this.currentPage = 1;
      this.applyFiltersAndRender();
    });

    this.renderer.onAdvancedSearch((advancedFilters) => {
      this.filters.advanced = advancedFilters;
      this.currentPage = 1;
      this.applyFiltersAndRender();
    });

    this.renderer.onClearFilters(() => {
      this.clearFilters();
    });

    this.renderer.onViewChange((view) => {
      this.handleViewChange(view);
    });

    this.renderer.onPrevPage(() => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderCurrentPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.renderer.onNextPage(() => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderCurrentPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.renderer.setOnPageClick((pageNumber) => {
      this.currentPage = pageNumber;
      this.renderCurrentPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  }

  handleViewChange(view) {
    this.currentView = view;
    this.renderer.changeView(view);
  }

  clearFilters() {
    this.filters = {
      titulo: '',
      isbn: '',
      persona: '',
      sortBy: 'titulo',
      sortDir: 'asc',
      advanced: this.getDefaultAdvancedFilters()
    };
    this.currentPage = 1;
    this.renderer.clearFilterInputs();
    this.applyFiltersAndRender();
  }


  async applyFiltersAndRender() {
    try {
      if (!this.hasLoadedAllBooks) {
        return;
      }

      const params = this.buildFilterParams();
      const filtered = this.service.applyFilters(this.allLibros, params);
      const sorted = this.service.applySort(filtered, params);

      this.filteredLibros = sorted;
      this.totalLibros = sorted.length;

      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages || 1;
      }

      this.renderCurrentPage();
    } catch (error) {
      console.error('❌ Error al aplicar filtros y renderizar:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
  }

  renderCurrentPage() {
    const total = this.totalLibros;
    const totalPages = this.getTotalPages();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const pageLibros = this.filteredLibros.slice(start, start + this.itemsPerPage);
    const startIndex = total === 0 ? 0 : start + 1;
    const endIndex = Math.min(start + this.itemsPerPage, total);

    const renderKey = `${this.filteredLibros.length}|${this.currentPage}|${this.currentView}|${JSON.stringify(this.filters)}`;
    if (renderKey === this.lastRenderKey) {
      return;
    }
    this.lastRenderKey = renderKey;

    this.renderer.renderLibros(pageLibros, {
      total,
      startIndex,
      endIndex
    });

    this.renderer.updatePagination({
      totalPages,
      currentPage: this.currentPage,
      perPage: this.itemsPerPage
    });
  }

  buildFilterParams() {
    const params = new URLSearchParams();

    if (this.filters.titulo) params.set('titulo', this.filters.titulo);
    if (this.filters.isbn) params.set('isbn', this.filters.isbn);
    if (this.filters.persona) params.set('persona', this.filters.persona);
    if (this.filters.sortBy) params.set('sort_by', this.filters.sortBy);
    if (this.filters.sortDir) params.set('sort_dir', this.filters.sortDir);

    const adv = this.filters.advanced || {};
    if (adv.issn) params.set('issn', adv.issn);
    if (adv.editorial) params.set('editorial', adv.editorial);
    if (adv.idioma) params.set('idioma', adv.idioma);
    if (adv.anioPublicacion) params.set('anio_publicacion', adv.anioPublicacion);
    if (adv.tipo) params.set('tipo', adv.tipo);
    if (adv.cdu) params.set('cdu', adv.cdu);
    if (adv.lugarDePublicacion) params.set('lugar_de_publicacion', adv.lugarDePublicacion);
    if (adv.tituloInformativo) params.set('titulo_informativo', adv.tituloInformativo);
    if (adv.persona) params.set('persona', adv.persona);
    if (adv.temas) {
      const temaValues = String(adv.temas).split(',').map(value => value.trim()).filter(Boolean);
      if (temaValues.length > 0) {
        const isNumericList = temaValues.every(value => /^\d+$/.test(value));
        params.set(isNumericList ? 'tema_ids' : 'temas', temaValues.join(','));
      }
    }

    return params;
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.totalLibros / this.itemsPerPage));
  }

}

// ── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const service = new LibroService();
  const renderer = new CatalogRenderer();

  const controller = new CatalogController(service, renderer);

  window.catalogController = controller;
  window.libroService = service;
});
