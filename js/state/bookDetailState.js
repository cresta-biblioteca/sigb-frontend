/**
 * BookDetailState - Estado de la pagina de detalle de libro
 * Mantiene el estado sin conocimiento de DOM ni HTTP.
 */
class BookDetailState {
	constructor() {
		this.libro = null;
		this.loading = false;
		this.error = null;
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
}
