/**
 * ========== BOOK DETAIL PAGE - PUNTO DE ENTRADA ==========
 * Inicializa la pagina de detalle de libro sin controller separado.
 */
class BookDetailController {
	constructor(service, renderer) {
		this.service = service;
		this.renderer = renderer;
		this.libro = null;
		this.loading = false;
		this.error = null;
		this.editMode = false;
		this.currentId = null;

		this.init();
	}

	async init() {
		const libroId = this.getLibroIdFromUrl();
		if (!libroId) {
			this.renderer.showError('No se encontro el ID del libro en la URL.');
			return;
		}

		this.currentId = libroId;
		this.setupEventListeners();

		await this.loadLibro(libroId);
	}

	setupEventListeners() {
		this.renderer.onToggleEdit(() => {
			if (!this.libro) return;

			if (this.editMode) {
				this.editMode = false;
				this.renderer.hideEditMode();
				return;
			}

			this.editMode = true;
			this.renderer.showEditMode(this.libro);
		});

		this.renderer.onCancelEdit(() => {
			this.editMode = false;
			this.renderer.hideEditMode();
		});

		this.renderer.onSubmitEdit(async formData => {
			await this.updateLibro(formData);
		});
	}

	getLibroIdFromUrl() {
		const params = new URLSearchParams(window.location.search);
		return params.get('id');
	}

	async loadLibro(id) {
		try {
			this.loading = true;
			this.renderer.showLoading();

			const libro = await this.service.loadLibroById(id);

			this.libro = libro;
			this.error = null;
			this.renderer.renderLibro(libro);
			if (this.editMode) {
				this.renderer.showEditMode(libro);
			}
		} catch (error) {
			console.error('❌ Error al cargar detalle del libro:', error);
			this.error = error;
			this.renderer.showError('Error al cargar el libro. Por favor, intenta mas tarde.');
		} finally {
			this.loading = false;
		}
	}

	validateEditForm(formData) {
		if (!formData.titulo) {
			return 'El titulo es obligatorio.';
		}

		if (!Number.isInteger(formData.ejemplares) || formData.ejemplares < 0) {
			return 'La cantidad de ejemplares debe ser un numero entero mayor o igual a 0.';
		}

		if (formData.anio !== null && (!Number.isInteger(formData.anio) || formData.anio < 0)) {
			return 'El ano debe ser un numero entero positivo.';
		}

		return null;
	}

	buildUpdatePayload(formData) {
		return {
			titulo: formData.titulo,
			autor: formData.autor,
			isbn: formData.isbn,
			editorial: formData.editorial,
			anio: formData.anio,
			cdu: formData.cdu,
			descripcion: formData.descripcion,
			ejemplares: formData.ejemplares,
			disponibilidad: formData.ejemplares > 0 ? 'disponible' : 'no disponible'
		};
	}

	async updateLibro(formData) {
		const validationError = this.validateEditForm(formData);
		if (validationError) {
			this.renderer.showFormMessage(validationError, true);
			return;
		}

		if (!this.currentId) {
			this.renderer.showFormMessage('No se encontro el ID del libro para guardar.', true);
			return;
		}

		try {
			this.renderer.setEditSubmitting(true);
			this.renderer.showFormMessage('', false);

			const payload = this.buildUpdatePayload(formData);
			const libroActualizado = await this.service.updateLibro(this.currentId, payload);

			this.libro = libroActualizado;
			this.renderer.renderLibro(libroActualizado);
			this.renderer.showEditMode(libroActualizado);
			this.renderer.showFormMessage('Libro actualizado correctamente.', false);
		} catch (error) {
			console.error('❌ Error al actualizar libro:', error);
			this.renderer.showFormMessage(error.message || 'No se pudo guardar el libro.', true);
		} finally {
			this.renderer.setEditSubmitting(false);
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const service = new LibroService();
	const renderer = new BookDetailRenderer();

	const controller = new BookDetailController(service, renderer);

	window.bookDetailController = controller;
});
