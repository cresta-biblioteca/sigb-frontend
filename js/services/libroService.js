/**
 * Servicio de Libros - Comunicacion HTTP
 * Maneja todas las peticiones al backend (/api/libros, /api/categorias)
 *
 * Servicio orientado a API real.
 */

class LibroService {
  constructor() {
    // AbortController para cancelar requests en vuelo (usado en fetch real)
    this.librosAbortController = null;
  }

  get apiBaseUrl() {
    return 'http://localhost:8080/api/v1';
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
      //ARMAMOS LA URL CON LOS PARAMETROS DE FILTRO Y PAGINACION
      const query = params ? `?${params.toString()}` : '';
      //LLAMAMOS LA API CON FETCH Y EL SIGNAL DEL ABORT CONTROLLER
      const response = await fetch(`${this.apiBaseUrl}/libros${query}`, {
        signal: this.librosAbortController.signal
      });
      //MANEJO DE ERRORES HTTP
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      //PARSEAMOS LA RESPUESTA JSON Y NORMALIZAMOS EL FORMATO
      const data = await response.json();
      const normalized = this.normalizeListResponse(data);
      //LOG Y RETURN
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

    const titulo = (params.get('titulo') || '').toLowerCase().trim();
    const isbn = (params.get('isbn') || '').toLowerCase().trim();
    const issn = (params.get('issn') || '').toLowerCase().trim();
    const editorial = (params.get('editorial') || '').toLowerCase().trim();
    const idioma = (params.get('idioma') || '').toLowerCase().trim();
    const anioPublicacion = params.get('anio_publicacion') ? Number(params.get('anio_publicacion')) : null;
    const tipo = (params.get('tipo') || '').toLowerCase().trim();
    const cdu = (params.get('cdu') || '').toLowerCase().trim();
    const lugarDePublicacion = (params.get('lugar_de_publicacion') || '').toLowerCase().trim();
    const persona = (params.get('persona') || '').toLowerCase().trim();
    const tituloInformativo = (params.get('titulo_informativo') || '').toLowerCase().trim();
    const temaIds = (params.get('tema_ids') || '').split(',').map(value => value.trim()).filter(Boolean);
    const temas = (params.get('temas') || '').toLowerCase().trim();

    return libros.filter(libro => {
      if (titulo && !String(libro.titulo || '').toLowerCase().includes(titulo)) return false;
      if (isbn && String(libro.isbn || '').toLowerCase() !== isbn) return false;
      if (issn && String(libro.issn || '').toLowerCase() !== issn) return false;
      if (editorial && !String(libro.editorial || '').toLowerCase().includes(editorial)) return false;
      if (idioma && String(libro.idioma || '').toLowerCase() !== idioma) return false;
      if (anioPublicacion !== null && Number(libro.anio_publicacion || libro.anio || libro.año || 0) !== anioPublicacion) return false;
      if (tipo && String(libro.tipo || libro.tipo_documento || '').toLowerCase() !== tipo) return false;
      if (cdu && !String(libro.cdu || '').toLowerCase().includes(cdu)) return false;
      if (lugarDePublicacion && !String(libro.lugar_de_publicacion || libro.lugarDePublicacion || '').toLowerCase().includes(lugarDePublicacion)) return false;
      if (persona) {
        const personas = [
          libro.persona,
          libro.autor,
          libro.editor,
          ...(Array.isArray(libro.personas) ? libro.personas.map(p => `${p.nombre || ''} ${p.apellido || ''} ${p.rol || ''}`) : []),
          ...(Array.isArray(libro.autores) ? libro.autores : []),
          ...(Array.isArray(libro.editores) ? libro.editores : [])
        ].map(value => String(value || '').toLowerCase()).join(' ');
        if (!personas.includes(persona)) return false;
      }
      if (tituloInformativo && !String(libro.titulo_informativo || libro.tituloInformativo || '').toLowerCase().includes(tituloInformativo)) return false;

      if (temaIds.length > 0) {
        const libroTemaIds = Array.isArray(libro.tema_ids)
          ? libro.tema_ids.map(value => String(value).trim())
          : Array.isArray(libro.temas)
            ? libro.temas.map(tema => String(tema?.id ?? tema).trim())
            : [];
        if (!temaIds.some(id => libroTemaIds.includes(id))) return false;
      }

      if (temas) {
        const libroTemas = Array.isArray(libro.temas)
          ? libro.temas.map(tema => String(tema?.titulo || tema?.nombre || tema || '').toLowerCase()).join(' ')
          : String(libro.temas || '').toLowerCase();
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
      const response = await fetch(`${this.apiBaseUrl}/libros/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) return data[0] || null;
      return data.data || data.libro || data;
    } catch (error) {
      throw error;
    }

  }

  /**
   * Carga todas las categorias disponibles.
   * @returns {Promise<Array>}
   */
  async loadCategorias() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/categorias`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.categorias || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo libro.
   * @param {Object} libroData
   * @returns {Promise<Object>}
   */
  async createLibro(libroData) {
    // --- FETCH REAL ---
    try {
      const response = await fetch(`${this.apiBaseUrl}/libros`, {
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
      const response = await fetch(`${this.apiBaseUrl}/libros/${encodeURIComponent(id)}`, {
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

