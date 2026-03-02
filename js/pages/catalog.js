/**
 * ========== CATALOG PAGE - PUNTO DE ENTRADA ==========
 * 
 * Inicializa la aplicación del catálogo con arquitectura MVC:
 * - Model: CatalogState (gestión de estado)
 * - View: CatalogRenderer (renderizado de UI)
 * - Controller: CatalogController (lógica y orquestación)
 * - Service: LibroService (comunicación HTTP)
 * 
 * Estructura de archivos:
 * - js/services/libroService.js         → Comunicación HTTP
 * - js/state/catalogState.js            → Gestión de estado
 * - js/ui/catalogRenderer.js            → Renderizado de UI
 * - js/controllers/catalogController.js → Orquestación de lógica
 * - js/pages/catalog.js                 → Este archivo (inicialización)
 */

// Inicializar el catálogo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancias de las capas
  const state = new CatalogState();
  const service = new LibroService();
  const renderer = new CatalogRenderer();

  // Inicializar el controlador (orquestador principal)
  const controller = new CatalogController(state, service, renderer);

  // Exponer en window para debugging en consola
  window.catalogController = controller;
  window.catalogState = state;
});
