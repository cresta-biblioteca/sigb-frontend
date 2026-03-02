/**
 * Página de Agregar Libro - Punto de entrada
 * Inicializa el controlador, estado, servicio y renderizador
 */

// Inicializar cuando el DOM esté listo
function initializeAddBook() {
  // Esperar a que libroService esté disponible (inicializado por catalog.js)
  if (!window.libroService) {
    // Reintentar después de 100ms
    setTimeout(initializeAddBook, 100);
    return;
  }

  // Crear instancias de las capas
  const addBookState = new AddBookState();
  const addBookRenderer = new AddBookRenderer();
  const addBookController = new AddBookController(addBookState, window.libroService, addBookRenderer);

  // Exponer en window para debugging
  window.addBookController = addBookController;
  window.addBookState = addBookState;

  // Manejar evento de libro agregado para actualizar catálogo
  window.addEventListener('bookAdded', () => {
    console.log('📚 Actualizando catálogo después de agregar libro...');
    if (window.catalogController) {
      // Recargar el catálogo
      window.catalogController.applyFiltersAndRender();
    }
  });
}

// Iniciar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeAddBook);
