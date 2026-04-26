/**
 * Loans Service — Endpoints de prestamos del lector autenticado
 */

import { api, ApiError } from './api.js';
import { enrichLoansWithBibliographicData } from './loansBibliographicResolver.js';

function normalizeLoansResponse(response) {
  if (Array.isArray(response)) {
    return { data: response, pagination: null };
  }

  if (Array.isArray(response?.data)) {
    return {
      data: response.data,
      pagination: response.pagination ?? null,
    };
  }

  return {
    data: [],
    pagination: response?.pagination ?? null,
  };
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

function isLoanVigente(loan) {
  const rawStatus = String(loan?.estado ?? loan?.status ?? '').toUpperCase();
  return rawStatus === 'VIGENTE';
}


const loansService = {
  /**
   * Consulta prestamos del lector autenticado con filtro opcional por estado.
   *
   * @param {{ estado?: string }} [options]
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyLoans(options = {}) {
    const queryString = buildQueryString({ estado: options.estado });
    const endpoint = queryString
      ? `/lectores/me/prestamos?${queryString}`
      : '/lectores/me/prestamos';

    const response = await api.get(endpoint, { cache: 'no-store' });
    return normalizeLoansResponse(response);
  },

  /**
   * Retorna los prestamos vigentes del lector autenticado.
   *
   * @returns {Promise<{ data: Array<object>, pagination: object|null }>}
   */
  async getMyActive() {
    try {
      const response = await this.getMyLoans({ estado: 'VIGENTE' });
      const enrichedData = await enrichLoansWithBibliographicData(response.data ?? []);

      return {
        ...response,
        data: enrichedData,
      };
    } catch (error) {
      // Algunos backends no aceptan el filtro estado en query y responden 400.
      // En ese caso, consultamos todo y filtramos vigentes en frontend.
      if (error instanceof ApiError && error.status === 400) {
        const allLoansResponse = await this.getMyLoans();
        const activeLoans = (allLoansResponse.data ?? []).filter(isLoanVigente);
        const enrichedData = await enrichLoansWithBibliographicData(activeLoans);

        return {
          data: enrichedData,
          pagination: allLoansResponse.pagination ?? null,
        };
      }

      throw error;
    }
  },
};

export { loansService };