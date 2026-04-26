import { api, ApiError } from './api.js';

const bibliographicCache = new Map();
const loanDetailCache = new Map();
const ejemplarArticleCache = new Map();

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

function getLoanDetailId(loan) {
  return loan?.id
    ?? loan?.prestamo_id
    ?? loan?.prestamoId
    ?? loan?.loan_id
    ?? loan?.loanId
    ?? null;
}

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

async function getArticleDetailByArticleId(articleId) {
  const cacheKey = String(articleId);

  if (bibliographicCache.has(cacheKey)) {
    return bibliographicCache.get(cacheKey);
  }

  const response = await api.get(`/articulos/${articleId}`, { cache: 'no-store' });
  const normalized = normalizeArticleBibliographicResource(response);
  bibliographicCache.set(cacheKey, normalized);

  return normalized;
}

async function getBookDetailByArticleId(articleId) {
  const cacheKey = `book:${String(articleId)}`;

  if (bibliographicCache.has(cacheKey)) {
    return bibliographicCache.get(cacheKey);
  }

  const response = await api.get(`/libros/${articleId}`, { cache: 'no-store' });
  const normalized = normalizeBookBibliographicResource(response);
  bibliographicCache.set(cacheKey, normalized);

  return normalized;
}

async function getLoanDetailById(loanId) {
  const cacheKey = String(loanId);

  if (loanDetailCache.has(cacheKey)) {
    return loanDetailCache.get(cacheKey);
  }

  const response = await api.get(`/prestamos/${loanId}`, { cache: 'no-store' });
  const detail = normalizeResource(response);
  loanDetailCache.set(cacheKey, detail);

  return detail;
}

async function getArticleIdByEjemplarId(ejemplarId) {
  const cacheKey = String(ejemplarId);

  if (ejemplarArticleCache.has(cacheKey)) {
    return ejemplarArticleCache.get(cacheKey);
  }

  const response = await api.get(`/ejemplares/${ejemplarId}`, { cache: 'no-store' });
  const ejemplar = normalizeResource(response);

  const articleId = ejemplar?.articulo_id
    ?? ejemplar?.articuloId
    ?? ejemplar?.article_id
    ?? ejemplar?.articleId
    ?? null;

  ejemplarArticleCache.set(cacheKey, articleId);
  return articleId;
}

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

    const bibliographic = {
      title: articleBibliographic?.title ?? bookBibliographic?.title ?? 'Sin título',
      author: bookBibliographic?.author ?? 'Autor no disponible',
      year: articleBibliographic?.year ?? bookBibliographic?.year ?? null,
      raw: {
        articulo: articleBibliographic?.raw ?? null,
        libro: bookBibliographic?.raw ?? null,
      },
    };

    return {
      ...loan,
      articleId,
      bibliographic,
      title: bibliographic.title,
      author: bibliographic.author,
      year: bibliographic.year,
    };
  } catch {
    return {
      ...loan,
      articleId,
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
}

async function enrichLoansWithBibliographicData(loans = []) {
  return Promise.all(loans.map(enrichLoanWithBibliographicData));
}

export { enrichLoansWithBibliographicData };