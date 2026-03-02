/**
 * BookDetailRenderer - Renderizado de la pagina de detalle
 * NO depende del State. Recibe datos desde el Controller.
 */
class BookDetailRenderer {
	constructor() {
		this.bookTitle = document.getElementById('bookTitle');
		this.bookAuthor = document.getElementById('bookAuthor');
		this.bookCover = document.getElementById('bookCover');
		this.bookAvailability = document.getElementById('bookAvailability');
		this.bookMetaList = document.getElementById('bookMetaList');
		this.bookDescription = document.getElementById('bookDescription');
		this.bookChips = document.getElementById('bookChips');
		this.bookLoading = document.getElementById('bookLoading');
		this.bookError = document.getElementById('bookError');
		this.bookLayout = document.getElementById('bookLayout');
	}

	showLoading() {
		if (this.bookLoading) {
			this.bookLoading.classList.remove('is-hidden');
		}
		if (this.bookError) {
			this.bookError.classList.add('is-hidden');
			this.bookError.textContent = '';
		}
		if (this.bookLayout) {
			this.bookLayout.classList.add('is-hidden');
		}
	}

	showError(message) {
		if (this.bookError) {
			this.bookError.textContent = message;
			this.bookError.classList.remove('is-hidden');
		}
		if (this.bookLoading) {
			this.bookLoading.classList.add('is-hidden');
		}
		if (this.bookLayout) {
			this.bookLayout.classList.add('is-hidden');
		}
	}

	renderLibro(libro) {
		if (!libro) {
			this.showError('No se encontro el libro solicitado.');
			return;
		}

		if (this.bookLoading) {
			this.bookLoading.classList.add('is-hidden');
		}
		if (this.bookError) {
			this.bookError.classList.add('is-hidden');
			this.bookError.textContent = '';
		}
		if (this.bookLayout) {
			this.bookLayout.classList.remove('is-hidden');
		}

		const title = libro.titulo || 'Libro sin titulo';
		const authorInfo = this.formatAuthors(libro);
		const description = libro.descripcion || libro.description || libro.resumen || 'Sin descripcion disponible.';
		const cover = libro.portada || '../assets/book-cover-default.jpg';
		const availability = this.getAvailabilityInfo(libro.disponibilidad);

		if (this.bookTitle) this.bookTitle.textContent = title;
		if (this.bookAuthor) this.bookAuthor.textContent = authorInfo || 'Autor desconocido';
		if (this.bookCover) {
			this.bookCover.src = cover;
			this.bookCover.alt = `Portada de ${title}`;
			this.bookCover.onerror = () => { this.bookCover.src = '../assets/book-cover-default.jpg'; };
		}
		if (this.bookAvailability) {
			this.bookAvailability.textContent = availability.text;
			this.bookAvailability.className = `book-detail__availability ${availability.class}`;
		}
		if (this.bookDescription) {
			this.bookDescription.textContent = description;
		}

		this.renderMeta(libro);
		this.renderChips(libro);
	}

	renderMeta(libro) {
		if (!this.bookMetaList) return;
		this.bookMetaList.innerHTML = '';

		const metaItems = [
			{ label: 'CDU', value: libro.cdu },
			{ label: 'ISBN', value: libro.isbn },
			{ label: 'Editorial', value: libro.editorial },
			{ label: 'Ano', value: libro.anio || libro.año },
			{ label: 'Paginas', value: libro.paginas },
			{ label: 'Idioma', value: libro.idioma },
			{ label: 'Categoria', value: this.getCategoriaText(libro) },
			{ label: 'Ubicacion', value: this.getLocationText(libro) }
		];

		metaItems
			.filter(item => item.value)
			.forEach(item => {
				const div = document.createElement('div');
				div.className = 'book-detail__meta-item';
				div.innerHTML = `
					<span class="book-detail__meta-label">${this.escapeHtml(item.label)}</span>
					<span class="book-detail__meta-value">${this.escapeHtml(String(item.value))}</span>
				`;
				this.bookMetaList.appendChild(div);
			});
	}

	renderChips(libro) {
		if (!this.bookChips) return;
		this.bookChips.innerHTML = '';

		const chips = [];
		if (Array.isArray(libro.colaboradores) && libro.colaboradores.length > 0) {
			libro.colaboradores.forEach(colaborador => {
				chips.push(colaborador);
			});
		}
		if (libro.titulo_informativo) {
			chips.push(libro.titulo_informativo);
		}

		if (chips.length === 0) {
			this.bookChips.innerHTML = '<span class="book-detail__meta-value">Sin informacion adicional.</span>';
			return;
		}

		chips.forEach(text => {
			const span = document.createElement('span');
			span.className = 'book-detail__chip';
			span.textContent = text;
			this.bookChips.appendChild(span);
		});
	}

	formatAuthors(libro) {
		if (libro.autor) return libro.autor;
		if (Array.isArray(libro.autores) && libro.autores.length > 0) {
			return libro.autores.join(', ');
		}
		return '';
	}

	getCategoriaText(libro) {
		if (libro.categoria && libro.categoria.nombre) return libro.categoria.nombre;
		if (libro.categoria) return libro.categoria;
		return '';
	}

	getLocationText(libro) {
		const ubicacion = libro.ubicacion || {};
		const ciudad = ubicacion.ciudad || libro.ciudad;
		const calle = ubicacion.calle || libro.calle;
		const numero = ubicacion.numero || ubicacion.altura || libro.numero || libro.altura;
		const parts = [ciudad, calle, numero].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : '';
	}

	getAvailabilityInfo(availability) {
		if (!availability) {
			return { class: 'book-detail__availability--unavailable', text: 'No disponible' };
		}

		const normalized = String(availability).toLowerCase();
		if (normalized === 'available' || normalized === 'disponible') {
			return { class: 'book-detail__availability--available', text: 'Disponible' };
		}
		if (normalized === 'digital') {
			return { class: 'book-detail__availability--digital', text: 'Digital' };
		}
		return { class: 'book-detail__availability--unavailable', text: 'No disponible' };
	}

	escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}
