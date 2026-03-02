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
		this.bookEditToggle = document.getElementById('bookEditToggle');
		this.bookEditForm = document.getElementById('bookEditForm');
		this.bookEditCancel = document.getElementById('bookEditCancel');
		this.bookEditSave = document.getElementById('bookEditSave');
		this.bookEditMessage = document.getElementById('bookEditMessage');
		this.editTitulo = document.getElementById('editTitulo');
		this.editAutor = document.getElementById('editAutor');
		this.editISBN = document.getElementById('editISBN');
		this.editEditorial = document.getElementById('editEditorial');
		this.editAnio = document.getElementById('editAnio');
		this.editCDU = document.getElementById('editCDU');
		this.editDescripcion = document.getElementById('editDescripcion');
		this.editEjemplares = document.getElementById('editEjemplares');
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

	onToggleEdit(callback) {
		if (!this.bookEditToggle) return;
		this.bookEditToggle.addEventListener('click', callback);
	}

	onCancelEdit(callback) {
		if (!this.bookEditCancel) return;
		this.bookEditCancel.addEventListener('click', callback);
	}

	onSubmitEdit(callback) {
		if (!this.bookEditForm) return;
		this.bookEditForm.addEventListener('submit', event => {
			event.preventDefault();
			callback(this.getEditFormData());
		});
	}

	showEditMode(libro) {
		if (!this.bookEditForm) return;
		this.bookEditForm.classList.remove('is-hidden');
		if (this.bookEditToggle) this.bookEditToggle.textContent = 'Ocultar edicion';
		this.fillEditForm(libro);
		this.showFormMessage('', false);
	}

	hideEditMode() {
		if (!this.bookEditForm) return;
		this.bookEditForm.classList.add('is-hidden');
		if (this.bookEditToggle) this.bookEditToggle.textContent = 'Editar (Administracion)';
		this.showFormMessage('', false);
	}

	fillEditForm(libro) {
		if (!libro) return;
		if (this.editTitulo) this.editTitulo.value = libro.titulo || '';
		if (this.editAutor) this.editAutor.value = libro.autor || (Array.isArray(libro.autores) ? libro.autores.join(', ') : '');
		if (this.editISBN) this.editISBN.value = libro.isbn || '';
		if (this.editEditorial) this.editEditorial.value = libro.editorial || '';
		if (this.editAnio) this.editAnio.value = libro.anio || libro.año || '';
		if (this.editCDU) this.editCDU.value = libro.cdu || '';
		if (this.editDescripcion) this.editDescripcion.value = libro.descripcion || libro.description || libro.resumen || '';
		if (this.editEjemplares) this.editEjemplares.value = this.getEjemplares(libro);
	}

	getEditFormData() {
		return {
			titulo: this.editTitulo ? this.editTitulo.value.trim() : '',
			autor: this.editAutor ? this.editAutor.value.trim() : '',
			isbn: this.editISBN ? this.editISBN.value.trim() : '',
			editorial: this.editEditorial ? this.editEditorial.value.trim() : '',
			anio: this.editAnio && this.editAnio.value !== '' ? Number(this.editAnio.value) : null,
			cdu: this.editCDU ? this.editCDU.value.trim() : '',
			descripcion: this.editDescripcion ? this.editDescripcion.value.trim() : '',
			ejemplares: this.editEjemplares && this.editEjemplares.value !== '' ? Number(this.editEjemplares.value) : 0
		};
	}

	setEditSubmitting(isSubmitting) {
		if (this.bookEditSave) {
			this.bookEditSave.disabled = isSubmitting;
			this.bookEditSave.textContent = isSubmitting ? 'Guardando...' : 'Guardar cambios';
		}
	}

	showFormMessage(message, isError = false) {
		if (!this.bookEditMessage) return;
		if (!message) {
			this.bookEditMessage.classList.add('is-hidden');
			this.bookEditMessage.textContent = '';
			this.bookEditMessage.classList.remove('book-detail__form-message--error', 'book-detail__form-message--success');
			return;
		}

		this.bookEditMessage.textContent = message;
		this.bookEditMessage.classList.remove('is-hidden');
		this.bookEditMessage.classList.toggle('book-detail__form-message--error', isError);
		this.bookEditMessage.classList.toggle('book-detail__form-message--success', !isError);
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
		const availability = this.getAvailabilityInfo(libro);

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

	getEjemplares(libro) {
		const sources = [libro.ejemplares, libro.disponibles, libro.cantidad];
		for (const value of sources) {
			if (value === 0 || value) {
				const numberValue = Number(value);
				if (!Number.isNaN(numberValue) && numberValue >= 0) return numberValue;
			}
		}
		if (String(libro.disponibilidad || '').toLowerCase() === 'disponible') return 1;
		return 0;
	}

	renderMeta(libro) {
		if (!this.bookMetaList) return;
		this.bookMetaList.innerHTML = '';

		const metaItems = [
			{ label: 'CDU', value: libro.cdu },
			{ label: 'ISBN', value: libro.isbn },
			{ label: 'Editorial', value: libro.editorial },
			{ label: 'Ano', value: libro.anio || libro.año },
			{ label: 'Ejemplares', value: this.getEjemplares(libro) },
			{ label: 'Paginas', value: libro.paginas },
			{ label: 'Idioma', value: libro.idioma },
			{ label: 'Categoria', value: this.getCategoriaText(libro) },
			{ label: 'Ubicacion', value: this.getLocationText(libro) }
		];

		metaItems
			.filter(item => item.value !== undefined && item.value !== null && item.value !== '')
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

	getAvailabilityInfo(libro) {
		const ejemplares = this.getEjemplares(libro);
		if (ejemplares <= 0) {
			return { class: 'book-detail__availability--unavailable', text: 'No disponible (0)' };
		}
		return { class: 'book-detail__availability--available', text: `${ejemplares} ejemplares` };
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
