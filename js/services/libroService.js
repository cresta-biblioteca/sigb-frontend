/**
 * Servicio de Libros - Comunicación HTTP
 * Maneja todas las peticiones al backend (/api/libros, /api/categorias)
 * 
 * Características:
 * - Cancela requests en vuelo para evitar race conditions
 * - Solo permite un request activo de libros a la vez
 * - Los request de categorías no se cancelan (se cargan una sola vez)
 */

class LibroService {
  constructor() {
    // AbortController para cancelar requests en vuelo
    this.librosAbortController = null;
  }

  /**
   * Carga libros desde la API con parámetros de filtrado
   * 
   * IMPORTANTE: Si se ejecuta mientras hay un request anterior,
   * el anterior es cancelado automáticamente.
   * Esto evita race conditions cuando usuario filtra rápidamente.
   * 
   * @param {URLSearchParams} params - Parámetros de búsqueda, filtrado, ordenamiento y paginación
   * @returns {Promise<{libros: Array, total: number}|{cancelled: true}>}
   *   - {libros, total}: Resultado exitoso
   *   - {cancelled: true}: Request fue cancelado por uno más nuevo
   * @throws {Error} Si ocurre un error HTTP o falla el fetch
   */
  async loadLibros(params) {
    // Cancelar request anterior si está en vuelo
    if (this.librosAbortController) {
      console.log('⛔ Cancelando request anterior de libros');
      this.librosAbortController.abort();
    }

    // Crear nuevo AbortController para este request
    this.librosAbortController = new AbortController();

    try {
      const query = params ? `?${params.toString()}` : '';
      const response = await fetch(`/api/libros${query}`, {
        signal: this.librosAbortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Asegurar que sea un array y existe propiedad total
      const libros = Array.isArray(data) ? data : data.libros || [];
      const total = typeof data.total === 'number' ? data.total : libros.length;
      
      console.log(`✅ Libros cargados: ${libros.length} (Total: ${total})`);
      return { libros, total };
    } catch (error) {
      // AbortError: el request fue cancelado (esperado, no es un error real)
      if (error.name === 'AbortError') {
        console.log('⚠️ Request de libros cancelado (reemplazado por uno más nuevo)');
        return { cancelled: true };
      }

      // Errores reales
      console.error('❌ Error al cargar libros:', error);
      throw error;
    }
  }

  /**
   * Carga un libro especifico por ID
   * @param {string|number} id - ID del libro
   * @returns {Promise<Object>} Libro encontrado
   * @throws {Error} Si ocurre un error HTTP o falla el fetch
   */
  async loadLibroById(id) {
    try {
      const response = await fetch(`/api/libros/${encodeURIComponent(id)}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Si la API devuelve un array, usar el primer elemento
      if (Array.isArray(data)) {
        return data[0] || null;
      }

      return data.libro || data;
    } catch (error) {
      console.error('❌ Error al cargar libro por ID:', error);
      throw error;
    }
  }

  /**
   * Carga todas las categorías disponibles
   * 
   * NOTA: Las categorías se cargan una sola vez al iniciar
   * No se cancelan aunque haya múltiples requests porque es poco probable
   * que el usuario cambie categorías mientras se están cargando.
   * 
   * @returns {Promise<Array>} Array de categorías con estructura {id, nombre, cdu_prefijo}
   * @throws {Error} Si ocurre un error HTTP o falla el fetch
   */
  async loadCategorias() {
    try {
      const response = await fetch('/api/categorias');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Procesar respuesta - puede ser array directo o {categorias: [...]}
      const categorias = Array.isArray(data) ? data : data.categorias || [];
      
      console.log(`✅ Categorías cargadas: ${categorias.length}`);
      return categorias;
    } catch (error) {
      console.error('❌ Error al cargar categorías:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo libro
   * @param {Object} libroData - Datos del libro a crear
   * @returns {Promise<Object>} Libro creado con su ID
   * @throws {Error} Si ocurre un error HTTP o validación
   */
  async createLibro(libroData) {
    try {
      const response = await fetch('/api/libros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(libroData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Procesar respuesta - puede ser el libro directamente o {libro: ...}
      const libro = data.libro || data;

      console.log('✅ Libro creado exitosamente:', libro);
      return libro;
    } catch (error) {
      console.error('❌ Error al crear libro:', error);
      throw error;
    }
  }

  /**
   * Actualiza un libro existente por ID
   * @param {string|number} id - ID del libro
   * @param {Object} libroData - Datos a actualizar
   * @returns {Promise<Object>} Libro actualizado
   */
  async updateLibro(id, libroData) {
    try {
      const response = await fetch(`/api/libros/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(libroData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.libro || data;
    } catch (error) {
      console.error('❌ Error al actualizar libro:', error);
      throw error;
    }
  }
}
