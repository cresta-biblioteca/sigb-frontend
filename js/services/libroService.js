/**
 * Servicio de Libros - Comunicacion HTTP
 * Maneja todas las peticiones al backend (/api/libros, /api/categorias)
 *
 * Si necesitas volver a mock data en memoria, comenta los bloques FETCH REAL
 * y descomenta los bloques MOCK en cada metodo.
 */

class LibroService {
  constructor() {
    // AbortController para cancelar requests en vuelo (usado en fetch real)
    this.librosAbortController = null;
  }

  /**
   * Carga libros aplicando filtros y paginacion.
   * Actualmente usa LIBROS_MOCK en memoria.
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
      //ARMAMOS LA URL CON LOS PARAMETROS DE FILTRO Y PAGINACION
      const query = params ? `?${params.toString()}` : '';
      //LLAMAMOS LA API CON FETCH Y EL SIGNAL DEL ABORT CONTROLLER
      const response = await fetch(`/api/v1/libros${query}`, {
        signal: this.librosAbortController.signal
      });
      //MANEJO DE ERRORES HTTP
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      //PARSEAMOS LA RESPUESTA JSON Y NORMALIZAMOS EL FORMATO
      const data = await response.json();
      const libros = Array.isArray(data) ? data : data.libros || [];
      const total = typeof data.total === 'number' ? data.total : libros.length;
      //LOG Y RETURN
      console.log(`✅ Libros cargados: ${libros.length} (Total: ${total})`);
      return { libros, total };

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Request de libros cancelado');
        return { cancelled: true };
      }
      throw error;
    }

    // --- MOCK --- TEST SIN BACKEND
    // return this._loadLibrosMock(params);
  }

  /** @private */
  _loadLibrosMock(params) {
    const allLibros = window.LIBROS_MOCK ? [...window.LIBROS_MOCK] : [];

    let filtered = this.applyFilters(allLibros, params);
    filtered = this.applySort(filtered, params);

    const total = filtered.length;
    const page = Math.max(1, Number(params?.get('page')) || 1);
    const perPage = Math.max(1, Number(params?.get('per_page')) || 12);
    const start = (page - 1) * perPage;
    const libros = filtered.slice(start, start + perPage);

    console.log(`✅ [Mock] Libros: ${libros.length} (Total: ${total})`);
    return Promise.resolve({ libros, total });
  }

  /**
   * Aplica filtros simples y avanzados sobre el array de libros.
   * @param {Array} libros
   * @param {URLSearchParams} params
   * @returns {Array}
   */
  applyFilters(libros, params) {
    if (!params) return libros;

    const search       = (params.get('search')        || '').toLowerCase().trim();
    const category     =  params.get('category')       || '';
    const availability =  params.get('availability')   || '';
    const titulo       = (params.get('titulo')         || '').toLowerCase();
    const autor        = (params.get('autor')          || '').toLowerCase();
    const isbn         = (params.get('isbn')           || '').toLowerCase();
    const editorial    = (params.get('editorial')      || '').toLowerCase();
    const anioDesde    = params.get('anio_desde') ? Number(params.get('anio_desde')) : null;
    const anioHasta    = params.get('anio_hasta') ? Number(params.get('anio_hasta')) : null;
    const idioma       =  params.get('idioma')         || '';
    const tipoDoc      =  params.get('tipo_documento') || '';
    const materia      = (params.get('materia')        || '').toLowerCase();
    const cduFilter    = (params.get('cdu')            || '').toLowerCase();
    const estante      = (params.get('estante')        || '').toLowerCase();
    const disponibilidad =  params.get('disponibilidad') || '';
    const categoriaAdv =  params.get('categoria')      || '';

    return libros.filter(libro => {
      // Busqueda simple (texto libre en varios campos)
      if (search) {
        const haystack = [
          libro.titulo, libro.autor, ...(libro.autores || []),
          libro.isbn, libro.editorial, libro.cdu, libro.materia,
          libro.descripcion, libro.description
        ].map(v => String(v || '').toLowerCase()).join(' ');
        if (!haystack.includes(search)) return false;
      }

      // Categoria (filtro simple)
      if (category && libro.categoria?.id !== category) return false;

      // Disponibilidad (checkboxes, coma-separados)
      if (availability) {
        const values = availability.split(',');
        if (!values.includes(this.normalizeDisponibilidad(libro.disponibilidad))) return false;
      }

      // Filtros avanzados
      if (titulo && !String(libro.titulo || '').toLowerCase().includes(titulo)) return false;
      if (autor) {
        const todos = [libro.autor, ...(libro.autores || [])].map(a => String(a || '').toLowerCase()).join(' ');
        if (!todos.includes(autor)) return false;
      }
      if (isbn && !String(libro.isbn || '').toLowerCase().includes(isbn)) return false;
      if (editorial && !String(libro.editorial || '').toLowerCase().includes(editorial)) return false;
      if (anioDesde !== null && (libro.anio || libro.año || 0) < anioDesde) return false;
      if (anioHasta !== null && (libro.anio || libro.año || 9999) > anioHasta) return false;
      if (idioma && libro.idioma !== idioma) return false;
      if (tipoDoc && libro.tipo_documento !== tipoDoc) return false;
      if (materia && !String(libro.materia || '').toLowerCase().includes(materia)) return false;
      if (cduFilter && !String(libro.cdu || '').toLowerCase().includes(cduFilter)) return false;
      if (estante && !String(libro.estante_carrera || '').toLowerCase().includes(estante)) return false;
      if (disponibilidad && this.normalizeDisponibilidad(libro.disponibilidad) !== disponibilidad) return false;
      if (categoriaAdv && libro.categoria?.id !== categoriaAdv) return false;

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
    const sort = params?.get('sort') || 'relevance';
    const sorted = [...libros];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => (b.anio || b.año || 0) - (a.anio || a.año || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title':
        sorted.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es'));
        break;
      case 'relevance':
      default:
        break;
    }
    return sorted;
  }

  /**
   * Normaliza los distintos valores de disponibilidad al formato interno.
   * @param {string} value
   * @returns {'available'|'unavailable'|'digital'|string}
   */
  normalizeDisponibilidad(value) {
    const v = String(value || '').toLowerCase();
    if (v === 'available'   || v === 'disponible')    return 'available';
    if (v === 'unavailable' || v === 'no disponible') return 'unavailable';
    if (v === 'digital')                              return 'digital';
    return v;
  }

  /**
   * Carga un libro especifico por ID.
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  async loadLibroById(id) {
    // --- FETCH REAL ---
    try {
      const response = await fetch(`/api/v1/libros/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data[0] || null : data.libro || data;
    } catch (error) {
      throw error;
    }

    // --- MOCK ---
    // const libro = (window.LIBROS_MOCK_POR_ID || {})[String(id)]
    //   || (window.LIBROS_MOCK || []).find(l => String(l.id) === String(id));
    // if (!libro) throw new Error(`Libro con id ${id} no encontrado`);
    // return Promise.resolve(libro);
  }

  /**
   * Carga todas las categorias disponibles.
   * @returns {Promise<Array>}
   */
  async loadCategorias() {
    // --- FETCH REAL ---
    try {
      const response = await fetch('/api/categorias');
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.categorias || [];
    } catch (error) {
      throw error;
    }

    // --- MOCK ---
    // if (window.CATEGORIAS_MOCK && window.CATEGORIAS_MOCK.length > 0) {
    //   return Promise.resolve(window.CATEGORIAS_MOCK);
    // }
    // return Promise.resolve(this.buildCategoriasFromLibros());
  }

  /**
   * Construye categorias unicas a partir de LIBROS_MOCK si no existe CATEGORIAS_MOCK.
   * @returns {Array}
   */
  buildCategoriasFromLibros() {
    const libros = window.LIBROS_MOCK || [];
    const seen = new Map();
    libros.forEach(libro => {
      if (libro.categoria?.id && !seen.has(libro.categoria.id)) {
        seen.set(libro.categoria.id, {
          id: libro.categoria.id,
          nombre: libro.categoria.nombre || libro.categoria.id,
          cdu_prefijo: ''
        });
      }
    });
    return Array.from(seen.values());
  }

  /**
   * Genera el siguiente ID de libro disponible (formato LIB-XXXX).
   * @returns {string}
   */
  generateNextId() {
    const libros = window.LIBROS_MOCK || [];
    const maxNum = libros.reduce((max, libro) => {
      const match = String(libro.id || '').match(/\d+$/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    return `LIB-${String(maxNum + 1).padStart(4, '0')}`;
  }

  /**
   * Crea un nuevo libro.
   * @param {Object} libroData
   * @returns {Promise<Object>}
   */
  async createLibro(libroData) {
    // --- FETCH REAL ---
    try {
      const response = await fetch('/api/v1/libros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(libroData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data.libro || data;
    } catch (error) {
      throw error;
    }

    // --- MOCK ---
    // const nuevoLibro = { ...libroData, id: this.generateNextId(), disponibilidad: 'available' };
    // if (window.LIBROS_MOCK) {
    //   window.LIBROS_MOCK.push(nuevoLibro);
    //   if (window.LIBROS_MOCK_POR_ID) window.LIBROS_MOCK_POR_ID[nuevoLibro.id] = nuevoLibro;
    // }
    // console.log('✅ [Mock] Libro creado:', nuevoLibro.id);
    // return Promise.resolve({ success: true, libro: nuevoLibro });
  }

  /**
   * Actualiza un libro existente por ID.
   * @param {string|number} id
   * @param {Object} libroData
   * @returns {Promise<Object>}
   */
  async updateLibro(id, libroData) {
    // --- FETCH REAL ---
    try {
      const response = await fetch(`/api/libros/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(libroData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data.libro || data;
    } catch (error) {
      throw error;
    }

    // --- MOCK ---
    // if (window.LIBROS_MOCK) {
    //   const idx = window.LIBROS_MOCK.findIndex(l => String(l.id) === String(id));
    //   if (idx !== -1) {
    //     window.LIBROS_MOCK[idx] = { ...window.LIBROS_MOCK[idx], ...libroData };
    //     if (window.LIBROS_MOCK_POR_ID) window.LIBROS_MOCK_POR_ID[id] = window.LIBROS_MOCK[idx];
    //     console.log('✅ [Mock] Libro actualizado:', id);
    //     return Promise.resolve({ success: true, libro: window.LIBROS_MOCK[idx] });
    //   }
    // }
    // return Promise.reject(new Error(`Libro con id ${id} no encontrado`));
  }
}

