/**
 * Estado del Catálogo - Gestión de datos
 * Mantiene y gestiona todo el estado de la aplicación del catálogo
 * 
 * IMPORTANTE: El frontend NO reconstruye lógica de dominio.
 * El backend es responsable de:
 * - Definir categorías y sus prefijos CDU
 * - Mantener relaciones entre recursos y clasificaciones
 * - Devolver datos ya procesados
 */

class CatalogState {
  constructor() {
    // Datos de libros
    this.allLibros = [];
    this.filteredLibros = [];
    this.totalLibros = 0;

    // Datos de categorías (tal como vienen del backend)
    this.allCategorias = [];

    // Paginación
    this.currentPage = 1;
    this.itemsPerPage = 10;

    // Vista actual
    this.currentView = 'grid'; // 'grid' o 'list'

    // Filtros actuales
    this.filters = {
      search: '',
      category: '',
      availability: [],
      sort: 'relevance'
    };
  }

  /**
   * Actualiza la lista de libros
   * @param {Array} libros - Array de libros desde la API
   */
  setLibros(libros) {
    this.allLibros = libros;
    this.filteredLibros = [...libros];
  }

  /**
   * Actualiza el total de libros encontrados
   * @param {number} total - Total de libros en el servidor
   */
  setTotalLibros(total) {
    this.totalLibros = total;
  }

  /**
   * Actualiza las categorías disponibles
   * @param {Array} categorias - Array de categorías desde el backend
   * 
   * Estructura esperada: [{ id, nombre, cdu_prefijo }, ...]
   * El backend es responsable de mantener la relación categoría-CDU
   */
  setCategorias(categorias) {
    this.allCategorias = categorias;
  }

  /**
   * Obtiene el prefijo CDU para una categoría
   * @param {string} categoryId - ID de la categoría
   * @returns {string} Prefijo CDU devuelto por el backend
   */
  getCDUPrefix(categoryId) {
    const categoria = this.allCategorias.find(cat => cat.id === categoryId);
    return categoria?.cdu_prefijo || '';
  }

  /**
   * Actualiza el valor de búsqueda
   * @param {string} search - Término de búsqueda
   */
  setSearch(search) {
    this.filters.search = search.toLowerCase();
    this.resetPage();
  }

  /**
   * Actualiza la categoría seleccionada
   * @param {string} category - ID de categoría
   */
  setCategory(category) {
    this.filters.category = category;
    this.resetPage();
  }

  /**
   * Actualiza la disponibilidad seleccionada (múltiple)
   * @param {Array<string>} availability - Array de valores de disponibilidad
   */
  setAvailability(availability) {
    this.filters.availability = availability;
    this.resetPage();
  }

  /**
   * Actualiza el criterio de ordenamiento
   * @param {string} sort - Criterio de ordenamiento
   */
  setSort(sort) {
    this.filters.sort = sort;
  }

  /**
   * Obtiene los filtros actuales
   * @returns {Object} Objeto de filtros
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Establece la página actual
   * @param {number} page - Número de página (1-indexed)
   */
  setCurrentPage(page) {
    this.currentPage = Math.max(1, page);
  }

  /**
   * Reinicia a la primera página
   * @private
   */
  resetPage() {
    this.currentPage = 1;
  }

  /**
   * Obtiene la página actual
   * @returns {number}
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Obtiene el índice inicial para paginación
   * @returns {number}
   */
  getStartIndex() {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  /**
   * Obtiene el índice final para paginación
   * @returns {number}
   */
  getEndIndex() {
    return this.getStartIndex() + this.itemsPerPage;
  }

  /**
   * Calcula el total de páginas
   * @returns {number}
   */
  getTotalPages() {
    return Math.ceil(this.totalLibros / this.itemsPerPage);
  }

  /**
   * Establece la vista actual (grid o list)
   * @param {string} view - 'grid' o 'list'
   */
  setView(view) {
    if (['grid', 'list'].includes(view)) {
      this.currentView = view;
    }
  }

  /**
   * Obtiene la vista actual
   * @returns {string}
   */
  getView() {
    return this.currentView;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.filters = {
      search: '',
      category: '',
      availability: [],
      sort: 'relevance'
    };
    this.currentPage = 1;
  }

  /**
   * Obtiene información resumida del estado
   * @returns {Object}
   */
  getState() {
    return {
      libros: this.allLibros.length,
      total: this.totalLibros,
      page: this.currentPage,
      totalPages: this.getTotalPages(),
      filters: this.getFilters(),
      view: this.currentView
    };
  }
}
