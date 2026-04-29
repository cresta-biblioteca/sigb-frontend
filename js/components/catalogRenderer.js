/**
 * Renderizador de Catálogo - Actualización del DOM
 * Maneja la actualización visual de la interfaz del catálogo
 * Encapsula toda la interacción con el DOM
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
    this.advancedSearchForm = document.getElementById('advancedSearchForm');
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
    this.onSimpleSearchCallback = null;
    this.onAdvancedSearchCallback = null;
    this.onCategoryChangeCallback = null;
    this.onSortChangeCallback = null;
    this.onAvailabilityChangeCallback = null;
    this.onClearFiltersCallback = null;
    this.onViewChangeCallback = null;
    this.onPrevPageCallback = null;
    this.onNextPageCallback = null;
    this.onPageClickCallback = null;
    this.onFavoriteToggleCallback = null;
  }

  /**
    * Registra callback para búsqueda simple (submit del formulario)
    * @param {Function} callback - Función({titulo, isbn, persona, sortBy, sortDir})
   */
  onSimpleSearch(callback) {
    this.onSimpleSearchCallback = callback;
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        callback(this.getSimpleFilters());
      });
    }
  }

  /**
   * Registra callback para búsqueda avanzada (submit del formulario avanzado)
    * @param {Function} callback - Función(advancedFilters)
   */
  onAdvancedSearch(callback) {
    this.onAdvancedSearchCallback = callback;
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
    return {
      titulo: this.simpleTituloInput ? this.simpleTituloInput.value.trim() : '',
      isbn: this.simpleIsbnInput ? this.simpleIsbnInput.value.trim() : '',
      persona: this.simplePersonaInput ? this.simplePersonaInput.value.trim() : '',
      sortBy: this.sortByFilter ? this.sortByFilter.value : 'titulo',
      sortDir: this.sortDirFilter ? this.sortDirFilter.value : 'asc'
    };
  }

  /**
   * Devuelve los filtros del formulario avanzado
   * @returns {Object}
   */
  getAdvancedFilters() {
    return {
      issn: this.advIssn ? this.advIssn.value.trim() : '',
      editorial: this.advEditorial ? this.advEditorial.value.trim() : '',
      idioma: this.advIdioma ? this.advIdioma.value : '',
      anioPublicacion: this.advAnioPublicacion ? this.advAnioPublicacion.value : '',
      tipo: this.advTipo ? this.advTipo.value.trim() : '',
      cdu: this.advCdu ? this.advCdu.value.trim() : '',
      lugarDePublicacion: this.advLugarPublicacion ? this.advLugarPublicacion.value.trim() : '',
      tituloInformativo: this.advTituloInformativo ? this.advTituloInformativo.value.trim() : '',
      persona: this.advPersona ? this.advPersona.value.trim() : '',
      temas: this.advTemas ? this.advTemas.value.trim() : ''
    };
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
   * Registra callback para cambio de categoría
   * @param {Function} callback - Función(categoryId)
   */
  onCategoryChange(callback) {
    this.onCategoryChangeCallback = callback;
    return callback;
  }

  /**
   * Registra callback para cambio de ordenamiento
   * @param {Function} callback - Función(sortBy)
   */
  onSortChange(callback) {
    this.onSortChangeCallback = callback;
    return callback;
  }

  /**
   * Registra callback para cambio de disponibilidad
   * @param {Function} callback - Función(availabilityArray)
   */
  onAvailabilityChange(callback) {
    this.onAvailabilityChangeCallback = callback;
    return callback;
  }

  /**
   * Registra callback para limpiar filtros
   * @param {Function} callback - Función()
   */
  onClearFilters(callback) {
    this.onClearFiltersCallback = callback;
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
    this.onViewChangeCallback = callback;
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
    this.onPrevPageCallback = callback;
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
    this.onNextPageCallback = callback;
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
   * Registra callback para toggle de favorito
   * Será usado con event delegation
   * @param {Function} callback - Función(libroId, button)
   */
  setOnFavoriteToggle(callback) {
    this.onFavoriteToggleCallback = callback;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.catalog-favorite-btn')) {
        const button = e.target.closest('.catalog-favorite-btn');
        const libroId = button.dataset.libroId;
        callback(libroId, button);
      }
    });
  }

  /**
   * Previene el submit del formulario de búsqueda
   * @deprecated No es necesario en el nuevo diseño (el submit es el disparador)
   */
  preventSearchFormSubmit() {
    // No-op: mantenido por compatibilidad
  }

  /**
   * Limpia los inputs de los filtros
   */
  clearFilterInputs() {
    if (this.simpleTituloInput) this.simpleTituloInput.value = '';
    if (this.simpleIsbnInput) this.simpleIsbnInput.value = '';
    if (this.simplePersonaInput) this.simplePersonaInput.value = '';
    if (this.sortByFilter) this.sortByFilter.value = 'titulo';
    if (this.sortDirFilter) this.sortDirFilter.value = 'asc';
    // Limpiar campos avanzados
    if (this.advIssn) this.advIssn.value = '';
    if (this.advEditorial) this.advEditorial.value = '';
    if (this.advIdioma) this.advIdioma.value = '';
    if (this.advAnioPublicacion) this.advAnioPublicacion.value = '';
    if (this.advTipo) this.advTipo.value = '';
    if (this.advCdu) this.advCdu.value = '';
    if (this.advLugarPublicacion) this.advLugarPublicacion.value = '';
    if (this.advTituloInformativo) this.advTituloInformativo.value = '';
    if (this.advPersona) this.advPersona.value = '';
    if (this.advTemas) this.advTemas.value = '';
  }

  /**
   * Renderiza los libros en el grid/list
   * @param {Array} libros - Array de libros a mostrar
   */
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

    // Renderizar cada libro
    libros.forEach((libro) => {
      const card = this.createBookCard(libro);
      this.booksGrid.appendChild(card);
    });

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
    article.setAttribute('data-libro-id', libro.id || '');

    const availability = this.getAvailabilityInfo(libro.disponibilidad);

    // Construir lista de autores
    let authorInfo = '';
    if (libro.autor) {
      authorInfo = libro.autor;
    } else if (Array.isArray(libro.autores) && libro.autores.length > 0) {
      authorInfo = libro.autores.join(', ');
    }

    // Construir información adicional
    const infoItems = [];
    if (libro.cdu) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>CDU:</strong> ${this.escapeHtml(libro.cdu)}</span>`);
    }
    if (libro.titulo_informativo) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Info:</strong> ${this.escapeHtml(libro.titulo_informativo)}</span>`);
    }
    if (Array.isArray(libro.colaboradores) && libro.colaboradores.length > 0) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Colaboradores:</strong> ${this.escapeHtml(libro.colaboradores.join(', '))}</span>`);
    }
    const locationText = this.getLocationText(libro);
    if (locationText) {
      infoItems.push(`<span class="catalog-book-info-item"><strong>Ubicación:</strong> ${this.escapeHtml(locationText)}</span>`);
    }

    const additionalInfo = infoItems.length > 0 ? `<div class="catalog-book-additional-info">${infoItems.join('')}</div>` : '';

    article.innerHTML = `
      <div class="catalog-book-card__image-wrapper">
        <img src="${this.escapeHtml(libro.portada || '../assets/book-cover-default.jpg')}" 
             alt="${this.escapeHtml(libro.titulo)}" 
             class="catalog-book-card__image"
             onerror="this.src='../assets/book-cover-default.jpg'">
        <span class="catalog-book-card__availability--${availability.class}">
          ${availability.text}
        </span>
      </div>
      <div class="catalog-book-card__content">
        <h3 class="catalog-book-card__title">${this.escapeHtml(libro.titulo)}</h3>
        ${authorInfo ? `<p class="catalog-book-card__author">${this.escapeHtml(authorInfo)}</p>` : ''}
        ${libro.description ? `<p class="catalog-book-card__description">${this.escapeHtml(libro.description)}</p>` : ''}
        
        ${additionalInfo}

        <div class="catalog-book-card__meta">
          <div class="catalog-book-card__rating">
            ${libro.rating ? `
              <span class="catalog-book-card__stars">${this.renderStars(libro.rating)}</span>
              <span class="catalog-book-card__rating-value">(${libro.rating.toFixed(1)})</span>
            ` : '<span class="catalog-book-card__rating-value">Sin calificación</span>'}
          </div>
          <span class="catalog-book-card__year">${libro.año || 'S/A'}</span>
        </div>
        <div class="catalog-book-card__actions">
          <a href="book-detail.html?id=${libro.id || ''}" class="btn btn--primary">Ver Detalle</a>
          <button class="btn btn--outline catalog-favorite-btn" 
                  aria-label="Agregar a favoritos"
                  data-libro-id="${libro.id || ''}"
                  title="Agregar a favoritos">
            <i class="lucide" data-lucide="heart"></i>
          </button>
        </div>
      </div>
    `;

    // Aplicar estado de favorito si está guardado
    const favoriteBtn = article.querySelector('.catalog-favorite-btn');
    if (favoriteBtn) {
      this.updateFavoriteButtonState(libro.id, favoriteBtn);
    }

    return article;
  }

  /**
   * Renderiza las categorías en el select
   * @param {Array} categorias - Array de categorías
   */
  renderCategorias(categorias) {
    return categorias;
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
  updateFavoriteButtonState(libroId, button) {
    if (!libroId) return;

    const favorites = JSON.parse(localStorage.getItem('bookFavorites') || '[]');
    const isFavorite = favorites.includes(libroId);

    if (isFavorite) {
      button.classList.add('catalog-favorite-btn--active');
    } else {
      button.classList.remove('catalog-favorite-btn--active');
    }
  }

  /**
   * Actualiza el contador de resultados
   * @param {number} total - Total de libros encontrados
   * @param {number} startIndex - Índice del primer libro en la página actual
   * @param {number} endIndex - Índice del último libro en la página actual
   */
  updateResultsCount(total, startIndex, endIndex) {
    if (!this.resultsCount) return;

    const from = total === 0 ? 0 : startIndex + 1;
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

    // Ocultar paginación si hay 1 o menos páginas
    if (pagination) {
      pagination.classList.toggle('catalog-pagination--hidden', totalPages <= 1);
    }

    if (totalPages <= 1) {
      paginationList.innerHTML = '';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    // Limpiar paginación anterior
    paginationList.innerHTML = '';

    // Generar números de página
    if (totalPages <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        this.createPageButton(i, paginationList, currentPage);
      }
    } else {
      // Si hay más de 5 páginas, mostrar navegación inteligente
      this.createPageButton(1, paginationList, currentPage);

      if (currentPage > 3) {
        const ellipsis = document.createElement('li');
        ellipsis.className = 'catalog-pagination__ellipsis';
        ellipsis.textContent = '...';
        paginationList.appendChild(ellipsis);
      }

      // Páginas alrededor de la actual
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        this.createPageButton(i, paginationList, currentPage);
      }

      if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement('li');
        ellipsis.className = 'catalog-pagination__ellipsis';
        ellipsis.textContent = '...';
        paginationList.appendChild(ellipsis);
      }

      this.createPageButton(totalPages, paginationList, currentPage);
    }

    // Actualizar estado de botones previo/siguiente
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
    }
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
