/**
 * BookDetailState - Estado de la pagina de detalle de libro
 * Mantiene el estado sin conocimiento de DOM ni HTTP.
 */
class BookDetailState {
	constructor() {
		this.libro = null;
		this.loading = false;
		this.error = null;
		this.editMode = false;
		this.currentId = null;
	}

	setLibro(libro) {
		this.libro = libro;
	}

	setLoading(loading) {
		this.loading = loading;
	}

	setError(error) {
		this.error = error;
	}

	getLibro() {
		return this.libro;
	}

	isLoading() {
		return this.loading;
	}

	getError() {
		return this.error;
	}

	setEditMode(value) {
		this.editMode = Boolean(value);
	}

	isEditMode() {
		return this.editMode;
	}

	setCurrentId(id) {
		this.currentId = id;
	}

	getCurrentId() {
		return this.currentId;
	}
}
