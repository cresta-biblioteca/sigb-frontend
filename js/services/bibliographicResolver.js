/**
 * Bibliographic Resolver — Enriquecimiento bibliográfico compartido
 *
 * Resuelve y cachea metadatos bibliográficos para artículos, libros y
 * ejemplares. Normaliza distintos contratos de API y aplica fallbacks
 * cuando faltan datos.
 *
 * Funcionalidad actual:
 *   - resolveBibliographicDataByArticleId(): obtiene título/autor/año
 *   - enrichLoanWithBibliographicData(): agrega metadata a un préstamo
 *   - enrichLoansWithBibliographicData(): aplica enriquecimiento en lote
 *   - Cachés internas: evitan llamadas repetidas por id de recurso
 */
import { api, ApiError } from './api.js';

const bibliographicCache = new Map();
const bibliographicPromiseCache = new Map();
const loanDetailCache = new Map();
const loanDetailPromiseCache = new Map();
const ejemplarArticleCache = new Map();
const ejemplarArticlePromiseCache = new Map();

// ── Normalización de recursos ────────────────────────────────────────────
function normalizeResource(response) {
  let current = response;

  while (current && typeof current === 'object' && !Array.isArray(current) && Object.prototype.hasOwnProperty.call(current, 'data')) {
    current = current.data;
  }

  if (current === undefined) {
    return response;
  }

  return current;
}

// ── Identificadores del préstamo ──────────────────────────────────────────
function getLoanDetailId(loan) {
  return loan?.id
    ?? loan?.prestamo_id
    ?? loan?.prestamoId
    ?? loan?.loan_id
    ?? loan?.loanId
    ?? null;
}

// ── Resolución de ids y metadatos ────────────────────────────────────────
function getLoanArticleId(loan) {
  return loan?.ejemplar?.articulo_id
    ?? loan?.ejemplar?.articuloId
    ?? loan?.ejemplar?.articulo?.id
    ?? loan?.ejemplar?.articulo?.articulo_id
    ?? loan?.ejemplar?.articulo?.articuloId
    ?? loan?.articulo_id
    ?? loan?.articuloId
    ?? loan?.article_id
    ?? loan?.articleId
    ?? loan?.libro_id
    ?? loan?.libroId
    ?? null;
}

function getLoanDetailArticleId(loanDetail) {
  return loanDetail?.ejemplar?.articulo_id
    ?? loanDetail?.ejemplar?.articuloId
    ?? loanDetail?.ejemplar?.articulo?.id
    ?? loanDetail?.ejemplar?.articulo?.articulo_id
    ?? loanDetail?.ejemplar?.articulo?.articuloId
    ?? loanDetail?.articulo_id
    ?? loanDetail?.articuloId
    ?? loanDetail?.article_id
    ?? loanDetail?.articleId
    ?? null;
}

function getLoanEjemplarId(loan) {
  return loan?.ejemplar_id
    ?? loan?.ejemplarId
    ?? loan?.ejemplar?.id
    ?? null;
}

// ── Normalización de año / autores ───────────────────────────────────────
function parseYear(value) {
  if (value === undefined || value === null || value === '') return null;

  const parsedYear = Number.parseInt(String(value), 10);
  return Number.isNaN(parsedYear) ? null : parsedYear;
}

function getBibliographicYear(resource) {
  return parseYear(
    resource?.articulo?.anioPublicacion
      ?? resource?.articulo?.anio_publicacion
      ?? resource?.anioPublicacion
      ?? resource?.anio_publicacion
      ?? resource?.publicationYear
      ?? resource?.publication_year
      ?? resource?.year
      ?? resource?.anio
  );
}

function getArticleBibliographicTitle(resource) {
  return resource?.titulo
    ?? resource?.articulo?.titulo
    ?? resource?.title
    ?? 'Sin título';
}

function getBookBibliographicTitle(resource) {
  return resource?.articulo?.titulo
    ?? resource?.articulo?.tituloInformativo
    ?? resource?.titulo
    ?? resource?.tituloInformativo
    ?? resource?.title
    ?? 'Sin título';
}

function getBookBibliographicYear(resource) {
  return parseYear(
    resource?.articulo?.anio_publicacion
      ?? resource?.articulo?.anioPublicacion
      ?? resource?.anioPublicacion
      ?? resource?.anio_publicacion
      ?? resource?.publicationYear
      ?? resource?.publication_year
      ?? resource?.year
      ?? resource?.anio
  );
}

function formatPersonName(person) {
  const fullName = String(person?.nombre_completo ?? person?.nombreCompleto ?? '').trim();
  if (fullName) return fullName;

  const firstName = String(person?.nombre ?? person?.firstName ?? '').trim();
  const lastName = String(person?.apellido ?? person?.lastName ?? '').trim();

  if (lastName && firstName) return `${lastName}, ${firstName}`;
  return lastName || firstName || '';
}

function isAuthorRole(person) {
  const role = String(person?.rol ?? person?.role ?? person?.tipo ?? '').toLowerCase();
  return role.includes('autor') || role.includes('coautor');
}

function getBookBibliographicAuthor(resource) {
  const persons = Array.isArray(resource?.personas)
    ? resource.personas
    : Array.isArray(resource?.articulo?.personas)
      ? resource.articulo.personas
      : [];

  const authors = persons
    .filter(isAuthorRole)
    .map(formatPersonName)
    .filter(Boolean);

  if (authors.length > 0) {
    return authors.join(', ');
  }

  return resource?.autor
    ?? resource?.author
    ?? resource?.autorInformativo
    ?? 'Autor no disponible';
}

// ── Normalización de respuestas bibliográficas ──────────────────────────
function normalizeArticleBibliographicResource(response) {
  const resource = normalizeResource(response);

  return {
    title: getArticleBibliographicTitle(resource),
    author: 'Autor no disponible',
    year: getBibliographicYear(resource),
    raw: resource ?? null,
  };
}

function normalizeBookBibliographicResource(response) {
  const resource = normalizeResource(response);

  return {
    title: getBookBibliographicTitle(resource),
    author: getBookBibliographicAuthor(resource),
    year: getBookBibliographicYear(resource),
    raw: resource ?? null,
  };
}

// ── Acceso a artículos/libros ────────────────────────────────────────────
async function getArticleDetailByArticleId(articleId) {
  const cacheKey = String(articleId);

  if (bibliographicCache.has(cacheKey)) {
    return bibliographicCache.get(cacheKey);
  }

  if (bibliographicPromiseCache.has(cacheKey)) {
    return bibliographicPromiseCache.get(cacheKey);
  }

  const request = api.get(`/articulos/${articleId}`, { cache: 'no-store' })
    .then((response) => {
      const normalized = normalizeArticleBibliographicResource(response);
      bibliographicCache.set(cacheKey, normalized);
      bibliographicPromiseCache.delete(cacheKey);
      return normalized;
    })
    .catch((error) => {
      bibliographicPromiseCache.delete(cacheKey);
      throw error;
    });

  bibliographicPromiseCache.set(cacheKey, request);

  return request;
}

async function getBookDetailByArticleId(articleId) {
  const cacheKey = `book:${String(articleId)}`;

  if (bibliographicCache.has(cacheKey)) {
    return bibliographicCache.get(cacheKey);
  }

  if (bibliographicPromiseCache.has(cacheKey)) {
    return bibliographicPromiseCache.get(cacheKey);
  }

  const request = api.get(`/libros/${articleId}`, { cache: 'no-store' })
    .then((response) => {
      const normalized = normalizeBookBibliographicResource(response);
      bibliographicCache.set(cacheKey, normalized);
      bibliographicPromiseCache.delete(cacheKey);
      return normalized;
    })
    .catch((error) => {
      bibliographicPromiseCache.delete(cacheKey);
      throw error;
    });

  bibliographicPromiseCache.set(cacheKey, request);

  return request;
}

async function resolveBibliographicDataByArticleId(articleId) {
  if (articleId === null || articleId === undefined || articleId === '') {
    return {
      title: 'Sin título',
      author: 'Autor no disponible',
      year: null,
      raw: null,
    };
  }

  try {
    const [articleBibliographic, bookBibliographic] = await Promise.all([
      getArticleDetailByArticleId(articleId).catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
      getBookDetailByArticleId(articleId).catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
    ]);

    return {
      title: articleBibliographic?.title ?? bookBibliographic?.title ?? 'Sin título',
      author: bookBibliographic?.author ?? 'Autor no disponible',
      year: articleBibliographic?.year ?? bookBibliographic?.year ?? null,
      raw: {
        articulo: articleBibliographic?.raw ?? null,
        libro: bookBibliographic?.raw ?? null,
      },
    };
  } catch {
    return {
      title: 'Sin título',
      author: 'Autor no disponible',
      year: null,
      raw: null,
    };
  }
}

// ── Acceso a préstamos y ejemplares ──────────────────────────────────────
async function getLoanDetailById(loanId) {
  const cacheKey = String(loanId);

  if (loanDetailCache.has(cacheKey)) {
    return loanDetailCache.get(cacheKey);
  }

  if (loanDetailPromiseCache.has(cacheKey)) {
    return loanDetailPromiseCache.get(cacheKey);
  }

  const request = api.get(`/prestamos/${loanId}`, { cache: 'no-store' })
    .then((response) => {
      const detail = normalizeResource(response);
      loanDetailCache.set(cacheKey, detail);
      loanDetailPromiseCache.delete(cacheKey);
      return detail;
    })
    .catch((error) => {
      loanDetailPromiseCache.delete(cacheKey);
      throw error;
    });

  loanDetailPromiseCache.set(cacheKey, request);

  return request;
}

async function getArticleIdByEjemplarId(ejemplarId) {
  const cacheKey = String(ejemplarId);

  if (ejemplarArticleCache.has(cacheKey)) {
    return ejemplarArticleCache.get(cacheKey);
  }

  if (ejemplarArticlePromiseCache.has(cacheKey)) {
    return ejemplarArticlePromiseCache.get(cacheKey);
  }

  const request = api.get(`/ejemplares/${ejemplarId}`, { cache: 'no-store' })
    .then((response) => {
      const ejemplar = normalizeResource(response);
      const articleId = ejemplar?.articulo_id
        ?? ejemplar?.articuloId
        ?? ejemplar?.article_id
        ?? ejemplar?.articleId
        ?? null;

      ejemplarArticleCache.set(cacheKey, articleId);
      ejemplarArticlePromiseCache.delete(cacheKey);
      return articleId;
    })
    .catch((error) => {
      ejemplarArticlePromiseCache.delete(cacheKey);
      throw error;
    });

  ejemplarArticlePromiseCache.set(cacheKey, request);
  return request;
}

// ── Enriquecimiento de préstamos ─────────────────────────────────────────
async function enrichLoanWithBibliographicData(loan) {
  const loanId = getLoanDetailId(loan);
  const loanDetail = loanId !== null && loanId !== undefined
    ? await getLoanDetailById(loanId).catch(() => loan)
    : loan;

  const mergedLoan = {
    ...loan,
    ...loanDetail,
    ejemplar: loanDetail?.ejemplar ?? loan?.ejemplar ?? null,
  };

  let articleId = getLoanDetailArticleId(mergedLoan) ?? getLoanArticleId(mergedLoan);

  if (articleId === null || articleId === undefined || articleId === '') {
    const ejemplarId = getLoanEjemplarId(mergedLoan);

    if (ejemplarId !== null && ejemplarId !== undefined && ejemplarId !== '') {
      articleId = await getArticleIdByEjemplarId(ejemplarId).catch(() => null);
    }
  }

  if (articleId === null || articleId === undefined || articleId === '') {
    return {
      ...loan,
      articleId: null,
      bibliographic: {
        title: 'Sin título',
        author: 'Autor no disponible',
        year: null,
        raw: null,
      },
      title: 'Sin título',
      author: 'Autor no disponible',
      year: null,
    };
  }

  const bibliographic = await resolveBibliographicDataByArticleId(articleId);

  return {
    ...loan,
    articleId,
    bibliographic,
    title: bibliographic.title,
    author: bibliographic.author,
    year: bibliographic.year,
  };
}

async function enrichLoansWithBibliographicData(loans = []) {
  return Promise.all(loans.map(enrichLoanWithBibliographicData));
}

export { resolveBibliographicDataByArticleId, enrichLoansWithBibliographicData };