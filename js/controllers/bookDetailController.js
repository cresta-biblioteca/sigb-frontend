/**
 * BookDetailController - Orquestacion de detalle de libro
 * Coordina State, Service y Renderer
 */
class BookDetailController {
	/**
	 * @param {BookDetailState} state
	 * @param {LibroService} service
	 * @param {BookDetailRenderer} renderer
	 */
	constructor(state, service, renderer) {
		this.state = state;
		this.service = service;
		this.renderer = renderer;

		this.init();
	}

	async init() {
		const libroId = this.getLibroIdFromUrl();
		if (!libroId) {
			this.renderer.showError('No se encontro el ID del libro en la URL.');
			return;
		}

		await this.loadLibro(libroId);
	}

	getLibroIdFromUrl() {
		const params = new URLSearchParams(window.location.search);
		return params.get('id');
	}

	async loadLibro(id) {
		try {
			this.state.setLoading(true);
			this.renderer.showLoading();

			const libro = await this.service.loadLibroById(id);

			this.state.setLibro(libro);
			this.state.setError(null);
			this.renderer.renderLibro(libro);
		} catch (error) {
			console.error('❌ Error al cargar detalle del libro:', error);
			this.state.setError(error);
			this.renderer.showError('Error al cargar el libro. Por favor, intenta mas tarde.');
		} finally {
			this.state.setLoading(false);
		}
	}
}
