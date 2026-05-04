/**
 * ========== BOOK DETAIL PAGE - PUNTO DE ENTRADA ==========
 * Inicializa la pagina de detalle de libro sin controller separado.
 */
import { LibroService } from '../services/libroService.js';

/**
 * BookDetailRenderer - Renderizado de la pagina de detalle
 * NO depende del State. Recibe datos desde el Controller.
 */
class BookDetailRenderer {
	constructor() {
		this.bookTitle = document.getElementById('bookTitle');
		this.bookAuthor = document.getElementById('bookAuthor');
		this.bookBreadcrumbTitle = document.getElementById('bookBreadcrumbTitle');
		this.workMetaList = document.getElementById('workMetaList');
		this.workBadgeEjemplares = document.getElementById('workBadgeEjemplares');
		this.bookBadges = document.getElementById('bookBadges');
		this.itemMetaList = document.getElementById('itemMetaList');
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
		if (this.editTitulo) this.editTitulo.value = this.getBookTitle(libro);
		if (this.editAutor) this.editAutor.value = this.getBookAuthors(libro);
		if (this.editISBN) this.editISBN.value = this.getBookField(libro, 'isbn') || '';
		if (this.editEditorial) this.editEditorial.value = this.getBookField(libro, 'editorial') || '';
		if (this.editAnio) this.editAnio.value = this.getBookYear(libro) || '';
		if (this.editCDU) this.editCDU.value = this.getBookField(libro, 'cdu') || '';
		if (this.editDescripcion) this.editDescripcion.value = this.getBookDescription(libro);
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

		const title = this.getBookTitle(libro) || 'Libro sin titulo';
		const authorInfo = this.getBookAuthors(libro);
		const description = this.getBookDescription(libro) || 'Sin descripcion disponible.';
		if (this.bookBreadcrumbTitle) this.bookBreadcrumbTitle.textContent = title;
		if (this.bookTitle) this.bookTitle.textContent = title;
		if (this.bookAuthor) this.bookAuthor.textContent = authorInfo || 'Autor desconocido';
		if (this.bookDescription) this.bookDescription.textContent = description;

		// Badges y resumen de ejemplares
		const ejemplaresCount = this.getEjemplares(libro);
		if (this.workBadgeEjemplares) this.workBadgeEjemplares.textContent = `Ejemplares: ${ejemplaresCount}`;
		if (this.bookBadges) this.bookBadges.classList.remove('is-hidden');

		this.renderMeta(libro);
		this.renderChips(libro);
		this.renderItemSummary(libro);
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

	hasValue(value) {
		return value !== undefined && value !== null && value !== '';
	}

	createMetaRowElement(label, value) {
		const div = document.createElement('div');
		div.className = 'book-detail__meta-row';

		const labelSpan = document.createElement('span');
		labelSpan.className = 'book-detail__meta-label';
		labelSpan.textContent = String(label);

		const valueSpan = document.createElement('span');
		valueSpan.className = 'book-detail__meta-value';
		valueSpan.textContent = String(value);

		div.appendChild(labelSpan);
		div.appendChild(valueSpan);
		return div;
	}

	renderMeta(libro) {
		if (!this.workMetaList) return;
		this.workMetaList.innerHTML = '';

		const sections = this.buildDetailSections(libro);
		sections.forEach(section => {
			if (!section.items.length) return;

			const heading = document.createElement('h3');
			heading.className = 'book-detail__section-title';
			heading.textContent = section.title;
			this.workMetaList.appendChild(heading);

			section.items.forEach(item => {
				this.workMetaList.appendChild(this.createMetaRowElement(item.label, item.value));
			});
		});
	}

	renderItemSummary(libro) {
		if (!this.itemMetaList) return;
		this.itemMetaList.innerHTML = '';

		if (Array.isArray(libro.ejemplares_detalle) && libro.ejemplares_detalle.length > 0) {
			const first = libro.ejemplares_detalle[0];
			this.itemMetaList.appendChild(this.createMetaRowElement('Código', first.codigo_barras || this.buildBarcode(libro.id || libro.codigo, 1)));
			this.itemMetaList.appendChild(this.createMetaRowElement('Ubicación', first.ubicacion || libro.estante || ''));
			this.itemMetaList.appendChild(this.createMetaRowElement('Estado', this.normalizeAvailability(first.estado || first.disponibilidad).text));
			return;
		}

		const total = this.getEjemplares(libro);
		if (total <= 0) {
			const empty = document.createElement('p');
			empty.className = 'book-detail__meta-value';
			empty.textContent = 'Sin ejemplares registrados.';
			this.itemMetaList.appendChild(empty);
			return;
		}

		this.itemMetaList.appendChild(this.createMetaRowElement('Ejemplares totales', total));
	}

	renderChips(libro) {
		if (!this.bookChips) return;
		this.bookChips.innerHTML = '';

		const chips = [];
		chips.push(...this.getBookPersonas(libro));
		chips.push(...this.getBookTemas(libro));

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

	getBookField(libro, ...keys) {
		const sources = [libro, libro?.articulo, libro?.libro, libro?.metadata];

		for (const source of sources) {
			if (!source) continue;
			for (const key of keys) {
				if (String(key).includes('.')) {
					const nestedValue = this.getNestedValue(source, key);
					if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
						return nestedValue;
					}
					continue;
				}
				const value = source[key];
				if (value !== undefined && value !== null && value !== '') {
					return value;
				}
			}
		}

		return '';
	}

	getNestedValue(object, path) {
		return String(path).split('.').reduce((current, segment) => {
			if (!current || typeof current !== 'object') return undefined;
			return current[segment];
		}, object);
	}

	getBookTitle(libro) {
		return this.getBookField(libro, 'titulo', 'title', 'articulo.titulo');
	}

	getBookAuthors(libro) {
		const directAuthor = this.getBookField(libro, 'autor', 'author', 'autorInformativo');
		if (directAuthor) return directAuthor;

		const authors = this.getBookField(libro, 'autores', 'authors');
		if (Array.isArray(authors) && authors.length > 0) {
			return authors.map(author => this.normalizePersonText(author)).filter(Boolean).join(', ');
		}

		const personas = this.getBookField(libro, 'personas');
		if (Array.isArray(personas) && personas.length > 0) {
			return personas
				.filter(person => this.isAuthorPerson(person))
				.map(person => this.normalizePersonText(person))
				.filter(Boolean)
				.join(', ');
		}

		return '';
	}

	getBookDescription(libro) {
		return this.getBookField(libro, 'description', 'descripcion', 'resumen', 'articulo.descripcion');
	}

	getBookYear(libro) {
		return this.getBookField(libro, 'año', 'anio', 'anio_publicacion', 'anioPublicacion', 'publicationYear', 'year', 'articulo.anio_publicacion', 'articulo.anioPublicacion');
	}

	buildDetailSections(libro) {
		const article = libro?.articulo || {};
		const topLevelItems = [
			{ label: 'ISBN', value: this.getBookField(libro, 'isbn') },
			{ label: 'ISSN', value: this.getBookField(libro, 'issn') },
			{ label: 'Páginas', value: this.getBookField(libro, 'paginas') },
			{ label: 'Título informativo', value: this.getBookField(libro, 'titulo_informativo', 'tituloInformativo') },
			{ label: 'CDU', value: this.getBookField(libro, 'cdu') },
			{ label: 'Editorial', value: this.getBookField(libro, 'editorial') },
			{ label: 'Lugar de publicación', value: this.getBookField(libro, 'lugar_de_publicacion', 'lugarDePublicacion') },
			{ label: 'Edición', value: this.getBookField(libro, 'edicion') },
			{ label: 'Dimensiones', value: this.getBookField(libro, 'dimensiones') },
			{ label: 'Ilustraciones', value: this.getBookField(libro, 'ilustraciones') },
			{ label: 'Serie', value: this.getBookField(libro, 'serie') },
			{ label: 'Número de serie', value: this.getBookField(libro, 'numero_serie', 'numeroSerie') },
			{ label: 'Notas', value: this.getBookField(libro, 'notas') },
			{ label: 'País de publicación', value: this.getBookField(libro, 'pais_publicacion', 'paisPublicacion') }
		].filter(item => this.hasValue(item.value));

		const personas = this.getBookContributorItems(libro);
		const temaItems = this.getBookTemas(libro);

		return [
			{ title: 'Datos generales', items: topLevelItems },
			{ title: 'Autores y colaboradores', items: personas },
			{
				title: 'Artículo',
				items: [
					{ label: 'Título', value: article.titulo },
					{ label: 'Año de publicación', value: article.anio_publicacion || article.anioPublicacion },
					{ label: 'Tipo', value: article.tipo },
					{ label: 'Idioma', value: article.idioma },
					{ label: 'Descripción', value: article.descripcion },
					{ label: 'Temas', value: temaItems.length > 0 ? temaItems.join(', ') : '' }
				].filter(item => this.hasValue(item.value))
			}
		].filter(section => section.items.length > 0);
	}

	getBookContributorItems(libro) {
		const personas = this.getBookField(libro, 'personas');
		if (!Array.isArray(personas) || personas.length === 0) return [];

		return personas
			.map(person => {
				const value = this.formatPersonDetail(person);
				if (!value) return null;

				const roleLabel = this.getPersonRoleLabel(person);
				return {
					label: roleLabel || 'Persona',
					value
				};
			})
			.filter(Boolean);
	}

	getBookPersonas(libro) {
		const personas = this.getBookField(libro, 'personas');
		if (!Array.isArray(personas)) return [];

		return personas.map(person => this.formatPersonDetail(person)).filter(Boolean);
	}

	getBookTemas(libro) {
		const temas = this.getBookField(libro, 'articulo.temas', 'temas');
		if (!Array.isArray(temas)) return [];

		return temas.map(tema => {
			if (typeof tema === 'string') return tema.trim();
			if (!tema || typeof tema !== 'object') return '';
			return String(tema.titulo || tema.nombre || tema.id || '').trim();
		}).filter(Boolean);
	}

	formatPersonDetail(person) {
		if (!person || typeof person !== 'object') return '';

		const nombre = String(person.nombre || '').trim();
		const apellido = String(person.apellido || '').trim();
		const base = [nombre, apellido].filter(Boolean).join(' ').trim();
		return base || 'Persona sin nombre';
	}

	getPersonRoleLabel(person) {
		const role = String(person?.rol || person?.role || person?.tipo || '').trim().toLowerCase();
		if (!role) return '';

		if (role.includes('autor') && role.includes('co')) return 'Coautor';
		if (role.includes('autor')) return 'Autor';
		if (role.includes('editor')) return 'Editor';
		if (role.includes('compil')) return 'Compilador';
		if (role.includes('traduc')) return 'Traductor';
		if (role.includes('ilustr')) return 'Ilustrador';
		if (role.includes('colab')) return 'Colaborador';
		return role.charAt(0).toUpperCase() + role.slice(1);
	}

	normalizePersonText(person) {
		if (typeof person === 'string') return person.trim();
		if (!person || typeof person !== 'object') return '';

		const nombreCompleto = person.nombre_completo || person.nombreCompleto;
		if (nombreCompleto) return String(nombreCompleto).trim();

		const nombre = String(person.nombre || person.firstName || '').trim();
		const apellido = String(person.apellido || person.lastName || '').trim();

		if (nombre && apellido) return `${apellido}, ${nombre}`;
		return apellido || nombre || '';
	}

	isAuthorPerson(person) {
		const role = String(person?.rol || person?.role || person?.tipo || '').toLowerCase();
		return role.includes('autor') || role.includes('coautor');
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

// ========== CONTROLLER ==========

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
		const storedLibro = this.getLibroFromSession();
		const libroId = this.getLibroIdFromUrl();
		if (!libroId && !storedLibro) {
			this.renderer.showError('No se encontro el ID del libro en la URL.');
			return;
		}

		this.currentId = libroId;
		this.setupEventListeners();

		if (storedLibro) {
			this.libro = storedLibro;
			this.renderer.renderLibro(storedLibro);
		}

		if (libroId) {
			await this.loadLibro(libroId, { showLoading: !storedLibro });
		}
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
		return params.get('id')
			|| params.get('libroId')
			|| params.get('articleId')
			|| params.get('articuloId');
	}

	getLibroFromSession() {
		try {
			const raw = sessionStorage.getItem('selectedBookForDetail');
			return raw ? JSON.parse(raw) : null;
		} catch (error) {
			console.warn('No se pudo leer el libro seleccionado desde sessionStorage:', error);
			return null;
		}
	}

	async loadLibro(id, options = {}) {
		try {
			this.loading = true;
			if (options.showLoading !== false) {
				this.renderer.showLoading();
			}

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
			if (!this.libro) {
				this.renderer.showError('Error al cargar el libro. Por favor, intenta mas tarde.');
			}
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
	const service = new LibroService();
	const renderer = new BookDetailRenderer();

	const controller = new BookDetailController(service, renderer);

	window.bookDetailController = controller;
});
