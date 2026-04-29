/**
 * Artículos Service — Gestión del catálogo
 *
 * Contratos según OpenAPI spec (endpoints-backend/endpoints.yml):
 *
 *   POST /libros
 *     Body:  { articulo: { titulo*, anio_publicacion*, tipo_documento_id*,
 *                          idioma?, descripcion? },
 *              libro:    { isbn?, issn?, paginas?, editorial?,
 *                          lugar_de_publicacion?, edicion?, cdu?,
 *                          titulo_informativo?, dimensiones?, ilustraciones?,
 *                          serie?, numero_serie?, notas?, pais_publicacion?,
 *                          personas?: [{ nombre, apellido, rol, orden }] } }
 *     201:   LibroResponse
 *     400:   datos inválidos
 *     422:   error de negocio
 *
 *   GET /documentos
 *     200:   TipoDocumentoResponse[]  → { id, codigo, descripcion, renovable, detalle }
 *
 *   POST /articulos/importar/marc21  (multipart/form-data)
 *     Field: archivo → archivo .mrc, .marc o .xml (MARCXML)
 *     201:   { importados: number, total: number,
 *              registros: [{ id, titulo, tipo }],
 *              errores:   [{ indice, titulo?, mensaje }] }
 *     400:   formato de archivo inválido
 *     422:   error de procesamiento
 */

import { api } from './api.js';

const articulosService = {
  /**
   * Crea un libro con su artículo base y personas asociadas.
   * @param {{ articulo: object, libro: object }} data
   * @returns {Promise<object>} LibroResponse
   */
  crearLibro(data) {
    return api.post('/libros', data);
  },

  /**
   * Lista los tipos de documento disponibles para el selector del formulario.
   * @returns {Promise<Array<{ id: number, codigo: string, descripcion: string }>>}
   */
  getTiposDocumento() {
    return api.get('/documentos');
  },

  /**
   * Importa registros MARC21 (ISO 2709 o MARCXML) desde un archivo.
   * El backend determina el tipo de artículo según el leader del registro.
   *
   * @param {File} archivo - Archivo .mrc, .marc o .xml
   * @returns {Promise<{ importados: number, total: number,
   *                     registros: Array<{ id: number, titulo: string, tipo: string }>,
   *                     errores:   Array<{ indice: number, titulo?: string, mensaje: string }> }>}
   */
  importarMarc21(archivo) {
    const fd = new FormData();
    fd.append('archivo', archivo);
    return api.post('/articulos/importar/marc21', fd);
  },

  // TODO: listarLibros(params)       → GET /libros
  // TODO: obtenerLibro(id)           → GET /libros/{id}
  // TODO: actualizarLibro(id, data)  → PATCH /libros/{id}
  // TODO: eliminarLibro(id)          → DELETE /libros/{id}
};

export { articulosService };
