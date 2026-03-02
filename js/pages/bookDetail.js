/**
 * ========== BOOK DETAIL PAGE - PUNTO DE ENTRADA ==========
 * Inicializa la pagina de detalle de libro.
 */
document.addEventListener('DOMContentLoaded', () => {
	const state = new BookDetailState();
	const service = new LibroService();
	const renderer = new BookDetailRenderer();

	const controller = new BookDetailController(state, service, renderer);

	window.bookDetailController = controller;
	window.bookDetailState = state;
});
