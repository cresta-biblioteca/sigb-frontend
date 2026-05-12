/**
 * Servicio de Libros - Comunicacion HTTP
 * Maneja todas las peticiones al backend (/api/libros, /api/categorias)
 *
 * Servicio orientado a API real.
 */

import { api } from './api.js';

class LibroService {
  constructor() {
    // AbortController para cancelar requests en vuelo (usado en fetch real)
    this.librosAbortController = null;
  }

  normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  getNestedValue(source, path) {
    return String(path).split('.').reduce((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return current[segment];
    }, source);
  }

  getLibroField(libro, ...keys) {
    const sources = [libro, libro?.articulo, libro?.libro, libro?.metadata].filter(Boolean);

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

  /**
   * Extrae la lista de libros y la paginacion desde la respuesta del backend.
   * @param {Object|Array} data
   * @returns {{libros: Array, total: number, pagination: Object|null}}
   */
  normalizeListResponse(data) {
    if (Array.isArray(data)) {
      return { libros: data, total: data.length, pagination: null };
    }

    const libros = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.libros)
        ? data.libros
        : [];
    const pagination = data?.pagination || null;
    const total = typeof pagination?.total === 'number'
      ? pagination.total
      : typeof data?.total === 'number'
        ? data.total
        : libros.length;

    return { libros, total, pagination };
  }

  /**
   * Carga todo el catálogo en una sola request.
   * @returns {Promise<{libros: Array, total: number, pagination: Object|null}|{cancelled: true}>}
   */
  async loadAllLibros() {
    const allLibros = [];
    let currentPage = 1;
    let lastPage = 1;
    let pagination = null;

    while (currentPage <= lastPage) {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('per_page', '100');

      const result = await this.loadLibros(params);
      if (result.cancelled) {
        return { cancelled: true };
      }

      allLibros.push(...(Array.isArray(result.libros) ? result.libros : []));
      pagination = result.pagination || pagination;
      lastPage = typeof pagination?.last_page === 'number'
        ? pagination.last_page
        : currentPage;

      if (!result.libros || result.libros.length === 0) {
        break;
      }

      currentPage++;
    }

    return {
      libros: allLibros,
      total: typeof pagination?.total === 'number' ? pagination.total : allLibros.length,
      pagination: {
        ...(pagination || {}),
        current_page: 1,
        per_page: 100,
        last_page: Math.max(1, Math.ceil((typeof pagination?.total === 'number' ? pagination.total : allLibros.length) / 100))
      }
    };
  }

  /**
   * Carga libros aplicando filtros y paginacion.
   * @param {URLSearchParams} params
   * @returns {Promise<{libros: Array, total: number}|{cancelled: true}>}
   */

  // TRAER TODOS LOS LIBROS CON FILTROS Y PAGINACION (FETCH REAL)
  async loadLibros(params) {
    //CANCELAMOS REQUEST ANTERIORES SI EXISTE UNO EN VUELO
    if (this.librosAbortController) {
      console.log('⛔ Cancelando request anterior de libros');
      this.librosAbortController.abort();
    }
    this.librosAbortController = new AbortController();

    try {
      // Armamos endpoint con query y usamos el cliente HTTP centralizado.
      const query = params ? `?${params.toString()}` : '';
      const data = await api.get(`/libros${query}`, {
        signal: this.librosAbortController.signal
      });
      const normalized = this.normalizeListResponse(data);
      console.log(`✅ Libros cargados: ${normalized.libros.length} (Total: ${normalized.total})`);
      return normalized;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Request de libros cancelado');
        return { cancelled: true };
      }
      throw error;
    }

  }

  /**
   * Aplica filtros simples y avanzados sobre el array de libros.
   * @param {Array} libros
   * @param {URLSearchParams} params
   * @returns {Array}
   */
  applyFilters(libros, params) {
    if (!params) return libros;

    const titulo = this.normalizeText(params.get('titulo') || '');
    const isbn = this.normalizeText(params.get('isbn') || '');
    const issn = this.normalizeText(params.get('issn') || '');
    const editorial = this.normalizeText(params.get('editorial') || '');
    const idioma = this.normalizeText(params.get('idioma') || '');
    const anioPublicacion = params.get('anio_publicacion') ? Number(params.get('anio_publicacion')) : null;
    const tipo = this.normalizeText(params.get('tipo') || '');
    const cdu = this.normalizeText(params.get('cdu') || '');
    const lugarDePublicacion = this.normalizeText(params.get('lugar_de_publicacion') || '');
    const persona = this.normalizeText(params.get('persona') || '');
    const temas = this.normalizeText(params.get('temas') || '');

    return libros.filter(libro => {
      const libroTitulo = this.getLibroField(libro, 'titulo', 'title', 'articulo.titulo', 'libro.titulo');
      const libroIsbn = this.getLibroField(libro, 'isbn', 'libro.isbn');
      const libroIssn = this.getLibroField(libro, 'issn', 'libro.issn');
      const libroEditorial = this.getLibroField(
        libro,
        'editorial',
        'articulo.editorial',
        'libro.editorial'
      );
      const libroIdioma = this.getLibroField(libro, 'idioma', 'articulo.idioma');
      const libroTipo = this.getLibroField(libro, 'tipo', 'tipo_documento', 'articulo.tipo', 'articulo.tipo_documento');
      const libroCdu = this.getLibroField(libro, 'cdu', 'libro.cdu');
      const libroLugar = this.getLibroField(libro, 'lugar_de_publicacion', 'lugarDePublicacion', 'libro.lugar_de_publicacion');
      if (titulo && !this.normalizeText(libroTitulo).includes(titulo)) return false;
      if (isbn && this.normalizeText(libroIsbn) !== isbn) return false;
      if (issn && this.normalizeText(libroIssn) !== issn) return false;
      if (editorial && !this.normalizeText(libroEditorial).includes(editorial)) return false;
      if (idioma && this.normalizeText(libroIdioma) !== idioma) return false;
      if (anioPublicacion !== null && Number(libro.anio_publicacion || libro.anio || libro.año || 0) !== anioPublicacion) return false;
      if (tipo && this.normalizeText(libroTipo) !== tipo) return false;
      if (cdu && !this.normalizeText(libroCdu).includes(cdu)) return false;
      if (lugarDePublicacion && !this.normalizeText(libroLugar).includes(lugarDePublicacion)) return false;
      if (persona) {
        const personas = [
          libro.persona,
          libro.autor,
          libro.editor,
          ...(Array.isArray(libro.personas) ? libro.personas.map(p => `${p.nombre || ''} ${p.apellido || ''} ${p.rol || ''}`) : []),
          ...(Array.isArray(libro.autores) ? libro.autores : []),
          ...(Array.isArray(libro.editores) ? libro.editores : [])
        ].map(value => this.normalizeText(value || '')).join(' ');
        if (!personas.includes(persona)) return false;
      }
      if (temas) {
        const libroTemas = Array.isArray(libro.temas)
          ? libro.temas.map(tema => this.normalizeText(tema?.titulo || tema?.nombre || tema || '')).join(' ')
          : this.normalizeText(libro.temas || '');
        if (!libroTemas.includes(temas)) return false;
      }

      return true;
    });
  }

  /**
   * Aplica ordenamiento sobre el array ya filtrado.
   * @param {Array} libros
   * @param {URLSearchParams} params
   * @returns {Array}
   */
  applySort(libros, params) {
    const sortBy = params?.get('sort_by') || 'titulo';
    const sortDir = params?.get('sort_dir') || 'asc';
    const sorted = [...libros];
    const direction = sortDir === 'desc' ? -1 : 1;
    const normalize = (value) => String(value ?? '').toLowerCase();

    sorted.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortBy) {
        case 'isbn':
          valueA = normalize(a.isbn);
          valueB = normalize(b.isbn);
          break;
        case 'issn':
          valueA = normalize(a.issn);
          valueB = normalize(b.issn);
          break;
        case 'editorial':
          valueA = normalize(a.editorial);
          valueB = normalize(b.editorial);
          break;
        case 'anio_publicacion':
          valueA = Number(a.anio_publicacion || a.anio || a.año || 0);
          valueB = Number(b.anio_publicacion || b.anio || b.año || 0);
          return (valueA - valueB) * direction;
        case 'idioma':
          valueA = normalize(a.idioma);
          valueB = normalize(b.idioma);
          break;
        case 'tipo':
          valueA = normalize(a.tipo || a.tipo_documento);
          valueB = normalize(b.tipo || b.tipo_documento);
          break;
        case 'cdu':
          valueA = normalize(a.cdu);
          valueB = normalize(b.cdu);
          break;
        case 'lugar_de_publicacion':
          valueA = normalize(a.lugar_de_publicacion || a.lugarDePublicacion);
          valueB = normalize(b.lugar_de_publicacion || b.lugarDePublicacion);
          break;
        case 'persona':
          valueA = normalize(a.persona || a.autor || (Array.isArray(a.autores) ? a.autores.join(' ') : ''));
          valueB = normalize(b.persona || b.autor || (Array.isArray(b.autores) ? b.autores.join(' ') : ''));
          break;
        case 'titulo_informativo':
          valueA = normalize(a.titulo_informativo || a.tituloInformativo);
          valueB = normalize(b.titulo_informativo || b.tituloInformativo);
          break;
        case 'titulo':
        default:
          valueA = normalize(a.titulo);
          valueB = normalize(b.titulo);
          break;
      }

      return valueA.localeCompare ? valueA.localeCompare(valueB, 'es') * direction : 0;
    });
    return sorted;
  }

  /**
   * Carga un libro especifico por ID.
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  async loadLibroById(id) {
    const data = await api.get(`/libros/${encodeURIComponent(id)}`);
    if (Array.isArray(data)) return data[0] || null;
    return data?.data || data?.libro || data;
  }

 
}

export { LibroService };

