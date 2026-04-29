/**
 * ========== CATALOG PAGE - PUNTO DE ENTRADA ==========
 * 
 * Inicializa la aplicación del catálogo con arquitectura MVC:
 * - Service: LibroService (comunicación HTTP)
 * - View: CatalogRenderer (renderizado de UI)
 * - Orquestación: esta página (sin capa controller separada)
 */

class CatalogController {
  constructor(service, renderer) {
    this.service = service;
    this.renderer = renderer;

    this.allLibros = [];
    this.filteredLibros = [];
    this.totalLibros = 0;
    this.allCategorias = [];
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
      await this.applyFiltersAndRender();
      console.log('✅ Catálogo inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar el catálogo:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
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
        this.applyFiltersAndRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.renderer.onNextPage(() => {
      const totalPages = Math.ceil(this.totalLibros / this.itemsPerPage);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.applyFiltersAndRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.renderer.setOnPageClick((pageNumber) => {
      this.currentPage = pageNumber;
      this.applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    this.renderer.setOnFavoriteToggle((libroId, button) => {
      this.toggleFavorite(libroId, button);
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

  toggleFavorite(libroId, button) {
    if (!libroId) return;

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

  async applyFiltersAndRender() {
    try {
      const params = this.buildQueryParams();
      const result = await this.service.loadLibros(params);

      if (result.cancelled) {
        console.log('⏭️ Request cancelado, esperando el nuevo...');
        return;
      }

      const { libros, total } = result;

      this.allLibros = libros;
      this.filteredLibros = [...libros];
      this.totalLibros = total;

      console.log(`📖 Se cargaron ${libros.length} libros (Total: ${total})`);

      const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
      const endIndex = Math.min(this.currentPage * this.itemsPerPage, total);

      this.renderer.renderLibros(libros, {
        total,
        startIndex,
        endIndex
      });

      this.renderer.updatePagination({
        totalPages: Math.ceil(total / this.itemsPerPage),
        currentPage: this.currentPage
      });
    } catch (error) {
      console.error('❌ Error al aplicar filtros y renderizar:', error);
      this.renderer.showErrorMessage('Error al cargar el catálogo. Por favor, intenta más tarde.');
    }
  }

  buildQueryParams() {
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

    params.set('page', String(this.currentPage));
    params.set('per_page', String(this.itemsPerPage));

    console.log(`🔍 Query params: ${params.toString()}`);
    return params;
  }

  getState() {
    return {
      allLibros: this.allLibros,
      filteredLibros: this.filteredLibros,
      totalLibros: this.totalLibros,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      currentView: this.currentView,
      filters: this.filters
    };
  }
}

// Inicializar el catálogo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  const service = new LibroService();
  const renderer = new CatalogRenderer();

  const controller = new CatalogController(service, renderer);

  window.catalogController = controller;
  window.libroService = service;
});
