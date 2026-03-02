/**
 * Controlador del Catálogo - Orquestación de lógica
 * Coordina entre CatalogState, LibroService y CatalogRenderer
 * Maneja toda la lógica de negocio y events
 */

class CatalogController {
  /**
   * Constructor
   * @param {CatalogState} state - Instancia de CatalogState
   * @param {LibroService} service - Instancia de LibroService
   * @param {CatalogRenderer} renderer - Instancia de CatalogRenderer
   */
  constructor(state, service, renderer) {
    this.state = state;
    this.service = service;
    this.renderer = renderer;

    this.init();
  }

  /**
   * Inicialización del controlador
   */
  async init() {
    try {
      console.log('🚀 Inicializando catálogo...');

      // Cargar categorías desde el backend
      await this.loadCategorias();

      // Configurar event listeners
      this.setupEventListeners();

      // Cargar y renderizar libros iniciales
      await this.applyFiltersAndRender();

      console.log('✅ Catálogo inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar el catálogo:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
  }

  /**
   * Carga las categorías desde el servicio
   */
  async loadCategorias() {
    try {
      console.log('📚 Cargando categorías...');
      const categorias = await this.service.loadCategorias();
      this.state.setCategorias(categorias);
      this.renderer.renderCategorias(categorias);
      console.log(`✅ Categorías cargadas: ${categorias.length}`);
    } catch (error) {
      console.error('⚠️ Error al cargar categorías (continuando sin ellas):', error);
      // No detener la inicialización si fallan las categorías
    }
  }

  /**
   * Configura los event listeners de filtros y controles
   */
  setupEventListeners() {
    // Búsqueda CON DEBOUNCE (300ms)
    // El Renderer se encarga de hacer debounce automáticamente
    // Esto evita múltiples requests mientras el usuario está escribiendo
    this.renderer.onSearch((searchTerm) => {
      this.state.setSearch(searchTerm);
      this.applyFiltersAndRender();
    });

    // Categoría (sin debounce, es un dropdown con cambio discreto)
    this.renderer.onCategoryChange((categoryId) => {
      this.state.setCategory(categoryId);
      this.applyFiltersAndRender();
    });

    // Ordenamiento (sin debounce, es un dropdown con cambio discreto)
    this.renderer.onSortChange((sortType) => {
      this.state.setSort(sortType);
      this.applyFiltersAndRender();
    });

    // Disponibilidad (checkboxes)
    this.renderer.onAvailabilityChange((availability) => {
      this.state.setAvailability(availability);
      this.applyFiltersAndRender();
    });

    // Limpiar filtros
    this.renderer.onClearFilters(() => {
      this.clearFilters();
    });

    // Controles de vista (grid/list)
    this.renderer.onViewChange((view) => {
      this.handleViewChange(view);
    });

    // Prevenir submit del formulario
    this.renderer.preventSearchFormSubmit();

    // Botones de paginación (previo/siguiente)
    this.renderer.onPrevPage(() => {
      if (this.state.getCurrentPage() > 1) {
        this.state.setCurrentPage(this.state.getCurrentPage() - 1);
        this.applyFiltersAndRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.renderer.onNextPage(() => {
      const totalPages = this.state.getTotalPages();
      if (this.state.getCurrentPage() < totalPages) {
        this.state.setCurrentPage(this.state.getCurrentPage() + 1);
        this.applyFiltersAndRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Click en número de página
    this.renderer.setOnPageClick((pageNumber) => {
      this.state.setCurrentPage(pageNumber);
      this.applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Toggle de favorito
    this.renderer.setOnFavoriteToggle((libroId, button) => {
      this.toggleFavorite(libroId, button);
    });
  }

  /**
   * Maneja el cambio de vista (grid/list)
   * @param {string} view - 'grid' o 'list'
   */
  handleViewChange(view) {
    this.state.setView(view);
    this.renderer.changeView(view);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    // Limpiar estado
    this.state.clearFilters();

    // Limpiar inputs del renderer
    this.renderer.clearFilterInputs();

    // Recargar
    this.applyFiltersAndRender();
  }

  /**
   * Alterna la adición/eliminación de un libro de favoritos
   * @param {string} libroId - ID del libro
   * @param {HTMLElement} button - Botón de favorito
   */
  toggleFavorite(libroId, button) {
    if (!libroId) return;

    // Obtener favoritos del localStorage
    let favorites = JSON.parse(localStorage.getItem('bookFavorites') || '[]');
    const isFavorite = favorites.includes(libroId);

    if (isFavorite) {
      favorites = favorites.filter(id => id !== libroId);
      button.classList.remove('catalog-favorite-btn--active');
      console.log(`➖ Libro ${libroId} eliminado de favoritos`);
    } else {
      favorites.push(libroId);
      button.classList.add('catalog-favorite-btn--active');
      console.log(`➕ Libro ${libroId} agregado a favoritos`);
    }

    localStorage.setItem('bookFavorites', JSON.stringify(favorites));
  }

  /**
   * Aplica filtros y renderiza los libros
   * Orquesta la secuencia: fetchear -> renderizar -> paginar
   * 
   * IMPORTANTE: Si otro applyFiltersAndRender() se ejecuta mientras este está
   * en vuelo, el service.loadLibros() será cancelado automáticamente para evitar
   * race conditions. El método detecta esto y hace early return.
   */
  async applyFiltersAndRender() {
    try {
      // Construir parámetros de consulta
      const params = this.buildQueryParams();

      // Fetchear libros desde el servicio
      const result = await this.service.loadLibros(params);

      // Si el request fue cancelado por uno más nuevo, ignorar y retornar
      if (result.cancelled) {
        console.log('⏭️ Request cancelado, esperando el nuevo...');
        return;
      }

      // Desestructurar libros y total del resultado exitoso
      const { libros, total } = result;

      // Actualizar estado con los datos nuevos
      this.state.setLibros(libros);
      this.state.setTotalLibros(total);

      console.log(`📖 Se cargaron ${libros.length} libros (Total: ${total})`);

      // Renderizar libros en el DOM CON información de resultados
      const resultInfo = {
        total,
        startIndex: this.state.getStartIndex(),
        endIndex: this.state.getEndIndex()
      };
      this.renderer.renderLibros(libros, resultInfo);

      // Actualizar paginación CON datos explícitos
      const paginationData = {
        totalPages: this.state.getTotalPages(),
        currentPage: this.state.currentPage
      };
      this.renderer.updatePagination(paginationData);
    } catch (error) {
      console.error('❌ Error al aplicar filtros y renderizar:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
  }

  /**
   * Construye los parámetros de consulta para el backend
   * @returns {URLSearchParams}
   */
  buildQueryParams() {
    const params = new URLSearchParams();
    const filters = this.state.getFilters();

    // Agregar filtros al query string
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (filters.availability.length > 0) {
      params.set('availability', filters.availability.join(','));
    }
    if (filters.sort) {
      params.set('sort', filters.sort);
    }

    // Agregar paginación
    params.set('page', String(this.state.getCurrentPage()));
    params.set('per_page', String(this.state.itemsPerPage));

    console.log(`🔍 Query params: ${params.toString()}`);
    return params;
  }

  /**
   * Obtiene el estado actual del catálogo (para debugging)
   * @returns {Object}
   */
  getState() {
    return this.state.getState();
  }
}
