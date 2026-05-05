/**
 * ========== BOOK DETAIL PAGE - PUNTO DE ENTRADA ==========
 * Inicializa la pagina de detalle de libro sin controller separado.
 */
import { LibroService } from '../services/libroService.js';

const BOOK_DETAIL_TOP_FIELDS = [
	{ label: 'ISBN', key: 'isbn' },
	{ label: 'ISSN', key: 'issn' },
	{ label: 'Páginas', key: 'paginas' },
	{ label: 'Título informativo', key: ['titulo_informativo', 'tituloInformativo'] },
	{ label: 'CDU', key: 'cdu' },
	{ label: 'Editorial', key: 'editorial' },
	{ label: 'Lugar de publicación', key: ['lugar_de_publicacion', 'lugarDePublicacion'] },
	{ label: 'Edición', key: 'edicion' },
	{ label: 'Dimensiones', key: 'dimensiones' },
	{ label: 'Ilustraciones', key: 'ilustraciones' },
	{ label: 'Serie', key: 'serie' },
	{ label: 'Número de serie', key: ['numero_serie', 'numeroSerie'] },
	{ label: 'Notas', key: 'notas' },
	{ label: 'País de publicación', key: ['pais_publicacion', 'paisPublicacion'] }
];

const BOOK_DETAIL_ARTICLE_FIELDS = [
	{ label: 'Título', key: 'titulo' },
	{ label: 'Año de publicación', key: ['anio_publicacion', 'anioPublicacion'] },
	{ label: 'Tipo', key: 'tipo' },
	{ label: 'Idioma', key: 'idioma' },
	{ label: 'Descripción', key: 'descripcion' }
];

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
		this.bookSourcesCache = new WeakMap();
		this.detailSectionsCache = new WeakMap();
		this.availabilityRowsCache = new WeakMap();
	}

	setVisibility(element, isVisible) {
		if (!element) return;
		element.classList.toggle('is-hidden', !isVisible);
	}

	setText(element, text) {
		if (!element) return;
		element.textContent = text;
	}

	clearError() {
		if (!this.bookError) return;
		this.bookError.classList.add('is-hidden');
		this.bookError.textContent = '';
	}

	showLoading() {
		this.setVisibility(this.bookLoading, true);
		this.clearError();
		this.setVisibility(this.bookLayout, false);
		this.setVisibility(this.bookAvailabilityPanel, false);
	}

	showError(message) {
		if (this.bookError) {
			this.bookError.textContent = message;
			this.bookError.classList.remove('is-hidden');
		}
		this.setVisibility(this.bookLoading, false);
		this.setVisibility(this.bookLayout, false);
		this.setVisibility(this.bookAvailabilityPanel, false);
	}

	renderLibro(libro) {
		if (!libro) {
			this.showError('No se encontro el libro solicitado.');
			return;
		}

		this.setVisibility(this.bookLoading, false);
		this.clearError();
		this.setVisibility(this.bookLayout, true);
		this.setVisibility(this.bookAvailabilityPanel, true);

		const title = this.getBookTitle(libro) || 'Libro sin titulo';
		const authorInfo = this.getBookAuthors(libro);
		const description = this.getBookDescription(libro) || 'Sin descripcion disponible.';
		this.setText(this.bookBreadcrumbTitle, title);
		this.setText(this.bookTitle, title);
		this.setText(this.bookAuthor, authorInfo || 'Autor desconocido');
		this.setText(this.bookDescription, description);

		// Badges y resumen de ejemplares
		const ejemplaresCount = this.getEjemplares(libro);
		this.setText(this.workBadgeEjemplares, `Ejemplares: ${ejemplaresCount}`);
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

	buildMetaRowHtml(label, value) {
		return `<div class="book-detail__meta-row">
			<span class="book-detail__meta-label">${this.escapeHtml(label)}</span>
			<span class="book-detail__meta-value">${this.escapeHtml(value)}</span>
		</div>`;
	}

	renderMeta(libro) {
		if (!this.workMetaList) return;

		const sections = this.buildDetailSections(libro);
		const html = sections
			.filter(section => section.items.length > 0)
			.map(section => {
				const rows = section.items
					.map(item => this.buildMetaRowHtml(item.label, item.value))
					.join('');
				return `<h3 class="book-detail__section-title">${this.escapeHtml(section.title)}</h3>${rows}`;
			})
			.join('');

		this.workMetaList.innerHTML = html;
	}

	renderItemSummary(libro) {
		if (!this.itemMetaList) return;
		this.itemMetaList.innerHTML = '';

		if (Array.isArray(libro.ejemplares_detalle) && libro.ejemplares_detalle.length > 0) {
			const first = libro.ejemplares_detalle[0];
			this.itemMetaList.innerHTML = [
				this.buildMetaRowHtml('Código', first.codigo_barras || this.buildBarcode(libro.id || libro.codigo, 1)),
				this.buildMetaRowHtml('Ubicación', first.ubicacion || libro.estante || ''),
				this.buildMetaRowHtml('Estado', this.normalizeAvailability(first.estado || first.disponibilidad).text)
			].join('');
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

		this.itemMetaList.innerHTML = this.buildMetaRowHtml('Ejemplares totales', total);
	}

	renderChips(libro) {
		if (!this.bookChips) return;
		const chips = [
			...this.getBookPersonas(libro),
			...this.getBookTemas(libro)
		].filter(Boolean);

		this.bookChips.innerHTML = chips.length === 0
			? '<span class="book-detail__meta-value">Sin informacion adicional.</span>'
			: chips.map(text => `<span class="book-detail__chip">${this.escapeHtml(text)}</span>`).join('');
	}

	getBookSources(libro) {
		if (!libro || typeof libro !== 'object') return [];
		if (this.bookSourcesCache.has(libro)) return this.bookSourcesCache.get(libro);
		const sources = [libro, libro?.articulo, libro?.libro, libro?.metadata].filter(Boolean);
		this.bookSourcesCache.set(libro, sources);
		return sources;
	}

	getBookField(libro, ...keys) {
		const sources = this.getBookSources(libro);

		for (const source of sources) {
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
			return authors.map(author => this.formatPersonName(author, 'apellido-nombre')).filter(Boolean).join(', ');
		}

		const personas = this.getBookField(libro, 'personas');
		if (Array.isArray(personas) && personas.length > 0) {
			return personas
				.filter(person => this.isAuthorPerson(person))
				.map(person => this.formatPersonName(person, 'apellido-nombre'))
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
		if (libro && this.detailSectionsCache.has(libro)) {
			return this.detailSectionsCache.get(libro);
		}

		const article = libro?.articulo || {};
		const topLevelItems = BOOK_DETAIL_TOP_FIELDS.map(field => {
			const keys = Array.isArray(field.key) ? field.key : [field.key];
			return { label: field.label, value: this.getBookField(libro, ...keys) };
		}).filter(item => this.hasValue(item.value));

		const personas = this.getBookContributorItems(libro);
		const temaItems = this.getBookTemas(libro);

		const sections = [
			{ title: 'Datos generales', items: topLevelItems },
			{ title: 'Autores y colaboradores', items: personas },
			{
				title: 'Artículo',
				items: [
					...BOOK_DETAIL_ARTICLE_FIELDS.map(field => {
						const keys = Array.isArray(field.key) ? field.key : [field.key];
						const value = keys.reduce((result, key) => {
							if (result !== undefined && result !== null && result !== '') return result;
							const nextValue = article[key];
							return nextValue ?? result;
						}, '');
						return { label: field.label, value };
					}),
					{ label: 'Temas', value: temaItems.length > 0 ? temaItems.join(', ') : '' }
				].filter(item => this.hasValue(item.value))
			}
		].filter(section => section.items.length > 0);

		if (libro && typeof libro === 'object') {
			this.detailSectionsCache.set(libro, sections);
		}

		return sections;
	}

	getBookContributorItems(libro) {
		const personas = this.getBookField(libro, 'personas');
		if (!Array.isArray(personas) || personas.length === 0) return [];

		return personas
			.map(person => {
				const value = this.formatPersonName(person, 'nombre-apellido');
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

		return personas.map(person => this.formatPersonName(person, 'nombre-apellido')).filter(Boolean);
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

	formatPersonName(person, style = 'nombre-apellido') {
		if (typeof person === 'string') return person.trim();
		if (!person || typeof person !== 'object') return '';

		const nombreCompleto = person.nombre_completo || person.nombreCompleto;
		if (nombreCompleto) return String(nombreCompleto).trim();

		const nombre = String(person.nombre || person.firstName || '').trim();
		const apellido = String(person.apellido || person.lastName || '').trim();

		if (nombre && apellido) {
			return style === 'apellido-nombre' ? `${apellido}, ${nombre}` : `${nombre} ${apellido}`;
		}
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
		if (libro && this.availabilityRowsCache.has(libro)) {
			return this.availabilityRowsCache.get(libro);
		}

		if (Array.isArray(libro.ejemplares_detalle) && libro.ejemplares_detalle.length > 0) {
			const rows = libro.ejemplares_detalle.map((ej, i) => {
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
			if (libro && typeof libro === 'object') {
				this.availabilityRowsCache.set(libro, rows);
			}
			return rows;
		}

		const total = this.getEjemplares(libro);
		if (total <= 0) {
			const emptyRows = `<tr><td colspan="5">Sin ejemplares registrados.</td></tr>`;
			if (libro && typeof libro === 'object') {
				this.availabilityRowsCache.set(libro, emptyRows);
			}
			return emptyRows;
		}

		const tipo = this.getTipoMaterialText(libro.tipo_documento);
		const ubicacion = libro.estante || '';
		const rows = Array.from({ length: total }, (_, i) => {
			const barcode = this.buildBarcode(libro.id || libro.codigo, i + 1);
			const isFirst = i === 0;
			const norm = this.normalizeAvailability(isFirst ? 'available' : 'unavailable');
			const nota = isFirst ? '' : 'Vence: 20/05/2024';
			return `<tr>
				<td>${this.escapeHtml(barcode)}</td>
				<td>${this.escapeHtml(tipo)}</td>
				<td>${this.escapeHtml(ubicacion)}</td>
				<td><span class="book-detail__avail-badge book-detail__avail-badge--${norm.css}">${this.escapeHtml(norm.text)}</span></td>
				<td>${this.escapeHtml(nota)}</td>
			</tr>`;
		}).join('');

		if (libro && typeof libro === 'object') {
			this.availabilityRowsCache.set(libro, rows);
		}

		return rows;
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

		this.init();
	}

	async init() {
		const storedLibro = this.getLibroFromSession();
		const libroId = this.getLibroIdFromUrl();
		if (!libroId && !storedLibro) {
			this.renderer.showError('No se encontro el ID del libro en la URL.');
			return;
		}

		if (storedLibro) {
			this.libro = storedLibro;
			this.renderer.renderLibro(storedLibro);
		}

		if (libroId) {
			await this.loadLibro(libroId, { showLoading: !storedLibro });
		}
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
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
	const service = new LibroService();
	const renderer = new BookDetailRenderer();

	const controller = new BookDetailController(service, renderer);

	window.bookDetailController = controller;
});
