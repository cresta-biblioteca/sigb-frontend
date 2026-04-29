/**
 * BookDetailRenderer - Renderizado de la pagina de detalle
 * NO depende del State. Recibe datos desde el Controller.
 */
class BookDetailRenderer {
	constructor() {
		this.bookTitle = document.getElementById('bookTitle');
		this.bookAuthor = document.getElementById('bookAuthor');
		this.bookBreadcrumbTitle = document.getElementById('bookBreadcrumbTitle');
		this.bookCover = document.getElementById('bookCover');
		this.bookMetaList = document.getElementById('bookMetaList');
		this.bookDescription = document.getElementById('bookDescription');
		this.bookChips = document.getElementById('bookChips');
		this.bookLoading = document.getElementById('bookLoading');
		this.bookError = document.getElementById('bookError');
		this.bookLayout = document.getElementById('bookLayout');
		this.bookAvailabilityPanel = document.getElementById('bookAvailabilityPanel');
		this.bookAvailabilityRows = document.getElementById('bookAvailabilityRows');
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
		if (this.bookLoading) this.bookLoading.classList.remove('is-hidden');
		if (this.bookError) { this.bookError.classList.add('is-hidden'); this.bookError.textContent = ''; }
		if (this.bookLayout) this.bookLayout.classList.add('is-hidden');
		if (this.bookAvailabilityPanel) this.bookAvailabilityPanel.classList.add('is-hidden');
	}

	showError(message) {
		if (this.bookError) { this.bookError.textContent = message; this.bookError.classList.remove('is-hidden'); }
		if (this.bookLoading) this.bookLoading.classList.add('is-hidden');
		if (this.bookLayout) this.bookLayout.classList.add('is-hidden');
		if (this.bookAvailabilityPanel) this.bookAvailabilityPanel.classList.add('is-hidden');
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

		if (this.bookLoading) this.bookLoading.classList.add('is-hidden');
		if (this.bookError) { this.bookError.classList.add('is-hidden'); this.bookError.textContent = ''; }
		if (this.bookLayout) this.bookLayout.classList.remove('is-hidden');
		if (this.bookAvailabilityPanel) this.bookAvailabilityPanel.classList.remove('is-hidden');

		const title = libro.titulo || 'Libro sin titulo';
		const authorInfo = this.formatAuthors(libro);
		const description = libro.descripcion || libro.description || libro.resumen || 'Sin descripcion disponible.';
		const cover = libro.portada || '../assets/book-cover-default.jpg';

		if (this.bookBreadcrumbTitle) this.bookBreadcrumbTitle.textContent = title;
		if (this.bookTitle) this.bookTitle.textContent = title;
		if (this.bookAuthor) this.bookAuthor.textContent = authorInfo || 'Autor desconocido';
		if (this.bookCover) {
			this.bookCover.src = cover;
			this.bookCover.alt = `Portada de ${title}`;
			this.bookCover.onerror = () => { this.bookCover.src = '../assets/book-cover-default.jpg'; };
		}
		if (this.bookDescription) this.bookDescription.textContent = description;

		this.renderMeta(libro);
		this.renderChips(libro);
		this.renderAvailabilityTable(libro);
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
			{ label: 'Autor/es', value: this.formatAuthors(libro) },
			{ label: 'ISBN', value: libro.isbn },
			{ label: 'Tipo de Material', value: this.getTipoMaterialText(libro.tipo_documento) },
			{ label: 'CDU', value: libro.cdu },
			{ label: 'Editorial', value: libro.editorial },
			{ label: 'Ano de publicacion', value: libro.anio || libro.año },
			{ label: 'Idioma', value: this.getIdiomaText(libro.idioma) },
			{ label: 'Materia', value: libro.materia },
			{ label: 'Estante Virtual / Carrera', value: libro.estante }
		];

		metaItems
			.filter(item => item.value !== undefined && item.value !== null && item.value !== '')
			.forEach(item => {
				const div = document.createElement('div');
				div.className = 'book-detail__meta-row';
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

	getTipoMaterialText(tipoDocumento) {
		const map = {
			libro: 'Libro',
			revista: 'Revista',
			tesis: 'Tesis',
			digital: 'Digital',
			cd: 'CD / DVD',
			mapa: 'Mapa',
			otro: 'Otro'
		};
		return map[String(tipoDocumento || '').toLowerCase()] || tipoDocumento || '';
	}

	getIdiomaText(idioma) {
		const map = {
			es: 'Espanol',
			en: 'Ingles',
			fr: 'Frances',
			pt: 'Portugues',
			de: 'Aleman',
			it: 'Italiano'
		};
		return map[String(idioma || '').toLowerCase()] || idioma || '';
	}

	renderAvailabilityTable(libro) {
		if (!this.bookAvailabilityRows) return;
		const rows = this.buildAvailabilityRows(libro);
		this.bookAvailabilityRows.innerHTML = rows;
	}

	buildAvailabilityRows(libro) {
		if (Array.isArray(libro.ejemplares_detalle) && libro.ejemplares_detalle.length > 0) {
			return libro.ejemplares_detalle.map((ej, i) => {
				const norm = this.normalizeAvailability(ej.estado || ej.disponibilidad);
				const barcode = ej.codigo_barras || this.buildBarcode(libro.id || libro.codigo, i + 1);
				const tipo = this.getTipoMaterialText(ej.tipo_documento || libro.tipo_documento);
				const ubicacion = ej.ubicacion || libro.estante || '';
				const nota = ej.nota || '';
				return `<tr>
					<td>${this.escapeHtml(barcode)}</td>
					<td>${this.escapeHtml(tipo)}</td>
					<td>${this.escapeHtml(ubicacion)}</td>
					<td><span class="book-detail__avail-badge book-detail__avail-badge--${norm.css}">${this.escapeHtml(norm.text)}</span></td>
					<td>${this.escapeHtml(nota)}</td>
				</tr>`;
			}).join('');
		}

		const total = this.getEjemplares(libro);
		if (total <= 0) {
			return `<tr><td colspan="5">Sin ejemplares registrados.</td></tr>`;
		}

		const tipo = this.getTipoMaterialText(libro.tipo_documento);
		const ubicacion = libro.estante || '';
		const rows = [];
		for (let i = 0; i < total; i++) {
			const barcode = this.buildBarcode(libro.id || libro.codigo, i + 1);
			const isFirst = i === 0;
			const norm = this.normalizeAvailability(isFirst ? 'available' : 'unavailable');
			const nota = isFirst ? '' : 'Vence: 20/05/2024';
			rows.push(`<tr>
				<td>${this.escapeHtml(barcode)}</td>
				<td>${this.escapeHtml(tipo)}</td>
				<td>${this.escapeHtml(ubicacion)}</td>
				<td><span class="book-detail__avail-badge book-detail__avail-badge--${norm.css}">${this.escapeHtml(norm.text)}</span></td>
				<td>${this.escapeHtml(nota)}</td>
			</tr>`);
		}
		return rows.join('');
	}

	normalizeAvailability(value) {
		const v = String(value || '').toLowerCase();
		if (v === 'available' || v === 'disponible') return { text: 'Disponible', css: 'available' };
		if (v === 'unavailable' || v === 'prestado' || v === 'no disponible') return { text: 'Prestado', css: 'unavailable' };
		if (v === 'digital') return { text: 'Digital', css: 'digital' };
		return { text: value || 'Disponible', css: 'available' };
	}

	buildBarcode(baseCode, index) {
		const code = String(baseCode || '000').replace(/[^a-zA-Z0-9-]/g, '');
		return `BIB-${code}-${String(index).padStart(3, '0')}`;
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
