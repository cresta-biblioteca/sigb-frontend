import { prestamosService } from '../services/prestamosService.js';
import { ejemplaresService } from '../services/ejemplaresService.js';

const ITEMS_PER_PAGE = 10;
let currentPrestamoPage = 1;
let currentPrestamoFilter = 'todos';
let currentPrestamoFechaDesde = '';
let currentPrestamoFechaHasta = '';

// --- HELPERS ---
const getEstadoBadge = (estado) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower.includes('vigente')) {
        return `<span class="status-badge status-badge--active"><i class="fas fa-book-reader" style="margin-right: 4px;"></i> Vigente</span>`;
    } else if (estadoLower.includes('completado_vencido')) {
        return `<span class="status-badge status-badge--overdue"><i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>Vencido</span>`;
    } else if (estadoLower.includes('completado_exito')) {
        return `<span class="status-badge status-badge--returned"><i class="fas fa-undo-alt" style="margin-right: 4px;"></i> Devuelto</span>`;
    } else {
        return `<span class="status-badge status-badge--default">${estado || '-'}</span>`;
    }
};

// --- RENDER LOGIC ---
const renderPrestamosTable = async (page) => {
    const tbody = document.getElementById('tbodyPrestamos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Cargando préstamos...</td></tr>';

    try {
        const response = await prestamosService.getPrestamos(page, ITEMS_PER_PAGE, currentPrestamoFilter, currentPrestamoFechaDesde, currentPrestamoFechaHasta);
        const data = response?.data || response || [];
        const totalItems = response?.total || data.length;

        tbody.innerHTML = '';

        if (data.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-gray-500);">No hay préstamos para mostrar.</td></tr>';
             renderPagination('prestamosPagination', 0, page, () => {});
             return;
        }

        data.forEach(async prestamo => {
            const tr = document.createElement('tr');
            const ejemplar = await ejemplaresService.getEjemplarById(prestamo.ejemplar_id);
            console.log(ejemplar);
            
            const id = prestamo.id || '-';
            const lector_id = prestamo.lector_id || prestamo.lectorId || '-';
            
            const ejemplarTitulo = ejemplar?.data?.signatura_topografica || 'Artículo Desconocido';
            const ejemplarSub = ejemplar?.data?.codigo_barras || '';
            
            const estado = prestamo?.estado || prestamo.estado || 'Activo';
            const fechaPrestamo = prestamo?.fechaPrestamo || prestamo?.fecha_prestamo || prestamo.fecha_prestamo || '-';
            const fechaVencimiento = prestamo.fechaVencimiento || prestamo.fecha_vencimiento || '-';

            if (estado.toLowerCase().includes('vencido')) {
                tr.classList.add('circ-row--overdue');
            }

            tr.innerHTML = `
                <td class="circ-id">#P-${id}</td>
                <td>
                    <div class="circ-user-cell">
                        <p class="circ-user-cell__name">${lector_id}</p>
                    </div>
                </td>
                <td>
                    <div class="circ-article-cell">
                        <p class="circ-article-cell__title">${ejemplarTitulo}</p>
                        <p class="circ-article-cell__sub">${ejemplarSub}</p>
                    </div>
                </td>
                <td class="circ-date">${fechaPrestamo}</td>
                <td class="circ-date ${estado.toLowerCase().includes('vencido') ? 'circ-date--overdue' : ''}">
                    ${estado.toLowerCase().includes('vencido') ? '<i class="fas fa-exclamation-circle"></i> ' : ''}${fechaVencimiento}
                </td>
                <td>${getEstadoBadge(estado)}</td>
                <td>
                    <div class="circ-actions">
                        ${estado.toLowerCase().includes('completado_exito') || estado.toLowerCase().includes('completado_vencido') ? `
                        <a href="detalle-prestamo.html?id=${id}" class="btn-action btn-action--view" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </a>
                        ` : (() => {
                        // Calcular días restantes para mostrar/ocultar botón de renovación
                        let diasRestantes = null;
                        if (fechaVencimiento && fechaVencimiento !== '-') {
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            const venc = new Date(fechaVencimiento);
                            venc.setHours(0, 0, 0, 0);
                            diasRestantes = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
                        }
                        const puedeRenovar = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;
                        return `
                        <a href="detalle-prestamo.html?id=${id}" class="btn-action btn-action--view" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button class="btn-action btn-action--return" title="Registrar devolución" data-id="${id}">
                            <i class="fas fa-undo-alt"></i> Devolver
                        </button>
                        ${puedeRenovar ? `
                        <button class="btn-action btn-action--extend" title="Extender plazo" data-id="${id}">
                            <i class="fas fa-calendar-plus"></i>
                        </button>` : ''}
                        `;
                        })()}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('prestamosPagination', totalItems, page, (newPage) => {
            currentPrestamoPage = newPage;
            renderPrestamosTable(newPage);
        });
        
        // Disparamos actualización de estadísticas
        document.dispatchEvent(new Event('actualizar-stats-circulacion'));
        
    } catch (error) {
        console.error('Error al obtener préstamos:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-error);"><i class="fas fa-exclamation-circle"></i> Error al cargar los datos.</td></tr>';
    }
};

const renderPagination = (containerId, totalItems, currentPage, onPageChange) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    // Prev
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    container.appendChild(prevBtn);

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'pagination-btn--active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.addEventListener('click', () => onPageChange(i));
        container.appendChild(pageBtn);
    }

    // Next
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    container.appendChild(nextBtn);
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    let prestamosLoaded = false;
    const prestamosTab = document.querySelector('.circ-tab[data-tab="prestamos"]');

    if (prestamosTab) {
        prestamosTab.addEventListener('click', () => {
            if (!prestamosLoaded) {
                renderPrestamosTable(currentPrestamoPage);
                prestamosLoaded = true;
            }
        });
    }

    // Lógica de filtros
    const filterGroup = document.querySelector('#panel-prestamos .circ-filters');
    if (filterGroup) {
        const filters = filterGroup.querySelectorAll('.circ-filter');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                if (filter && filter !== currentPrestamoFilter) {
                    currentPrestamoFilter = filter;
                    currentPrestamoPage = 1;
                    renderPrestamosTable(currentPrestamoPage);
                    prestamosLoaded = true; // Por si se fuerza el clic desde JS
                }
            });
        });
    }

    // Lógica de devolución
    let currentDevolucionId = null;

    document.getElementById('tbodyPrestamos')?.addEventListener('click', (e) => {
        const btnReturn = e.target.closest('.btn-action--return');
        if (!btnReturn) return;

        const id = btnReturn.getAttribute('data-id');
        if (!id) return;

        const tr = btnReturn.closest('tr');
        const usuarioName = tr.querySelector('.circ-user-cell__name')?.textContent || '-';
        const articuloTitle = tr.querySelector('.circ-article-cell__title')?.textContent || '-';
        const fechaVenc = tr.querySelectorAll('.circ-date')[1]?.textContent?.trim() || '-';

        currentDevolucionId = id;
        document.getElementById('modalDevolucionId').textContent = `#P-${id}`;
        document.getElementById('modalDevolucionUsuario').textContent = usuarioName;
        document.getElementById('modalDevolucionArticulo').textContent = articuloTitle;
        document.getElementById('modalDevolucionVencimiento').textContent = fechaVenc;
        document.getElementById('modalNotaDevolucion').value = '';

        const overlay = document.getElementById('modalDevolucionOverlay');
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    });

    const closeModalDevolucion = () => {
        const overlay = document.getElementById('modalDevolucionOverlay');
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        currentDevolucionId = null;
    };

    document.getElementById('btnCloseModalDevolucion')?.addEventListener('click', closeModalDevolucion);
    document.getElementById('btnCancelarDevolucion')?.addEventListener('click', closeModalDevolucion);

    document.getElementById('btnConfirmarDevolucion')?.addEventListener('click', async () => {
        if (!currentDevolucionId) return;

        const btnConfirm = document.getElementById('btnConfirmarDevolucion');
        const originalText = btnConfirm.innerHTML;
        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btnConfirm.disabled = true;

        try {
            await prestamosService.marcarDevuelto(currentDevolucionId);
            closeModalDevolucion();
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
            renderPrestamosTable(currentPrestamoPage);
        } catch (error) {
            console.error('Error al registrar devolución:', error);
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
            alert('Error al registrar devolución.');
        }
    });

    // Lógica de renovación (Extender plazo)
    let currentRenovarId = null;

    document.getElementById('tbodyPrestamos')?.addEventListener('click', async (e) => {
        const btnExtend = e.target.closest('.btn-action--extend');
        if (!btnExtend) return;

        const id = btnExtend.getAttribute('data-id');
        if (!id) return;

        const tr = btnExtend.closest('tr');
        const usuarioName = tr.querySelector('.circ-user-cell__name')?.textContent || '-';
        const articuloTitle = tr.querySelector('.circ-article-cell__title')?.textContent || '-';
        const fechaVenc = tr.querySelectorAll('.circ-date')[1]?.textContent?.trim() || '-';

        currentRenovarId = id;
        document.getElementById('modalRenovarId').textContent = `#P-${id}`;
        document.getElementById('modalRenovarUsuario').textContent = usuarioName;
        document.getElementById('modalRenovarArticulo').textContent = articuloTitle;
        document.getElementById('modalRenovarVencActual').textContent = fechaVenc;

        // Fetch and populate tipos de préstamo
        const select = document.getElementById('modalRenovarTipoPrestamo');
        select.innerHTML = '<option value="">Mantener tipo actual</option>';
        try {
            const tiposResp = await prestamosService.getTiposPrestamos();
            const tipos = tiposResp?.data || tiposResp || [];
            tipos.forEach(tipo => {
                const opt = document.createElement('option');
                opt.value = tipo.id;
                opt.textContent = tipo.descripcion || tipo.nombre || `Tipo ${tipo.id}`;
                select.appendChild(opt);
            });
        } catch (err) {
            console.warn('No se pudieron cargar los tipos de préstamo:', err);
        }

        const overlay = document.getElementById('modalRenovarOverlay');
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    });

    const closeModalRenovar = () => {
        const overlay = document.getElementById('modalRenovarOverlay');
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        currentRenovarId = null;
    };

    document.getElementById('btnCloseModalRenovar')?.addEventListener('click', closeModalRenovar);
    document.getElementById('btnCancelarRenovar')?.addEventListener('click', closeModalRenovar);

    document.getElementById('btnConfirmarRenovar')?.addEventListener('click', async () => {
        if (!currentRenovarId) return;

        const btnConfirm = document.getElementById('btnConfirmarRenovar');
        const originalText = btnConfirm.innerHTML;
        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Renovando...';
        btnConfirm.disabled = true;

        try {
            const tipoSeleccionado = document.getElementById('modalRenovarTipoPrestamo').value;
            const body = tipoSeleccionado ? { tipo_prestamo_id: parseInt(tipoSeleccionado) } : null;
            console.log(body);
            await prestamosService.renovarPrestamo(currentRenovarId, body);
            closeModalRenovar();
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
            renderPrestamosTable(currentPrestamoPage);
        } catch (error) {
            console.error('Error al renovar préstamo:', error);
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
            alert('Error al renovar el préstamo.');
        }
    });

    // Lógica de fechas
    const fechaDesdePrestamoInput = document.getElementById('prestamoFechaDesde');
    const fechaHastaPrestamoInput = document.getElementById('prestamoFechaHasta');
    const btnLimpiarFechasPrestamo = document.getElementById('btnLimpiarFechasPrestamos');

    const handleFechaPrestamoChange = () => {
        currentPrestamoFechaDesde = fechaDesdePrestamoInput.value;
        currentPrestamoFechaHasta = fechaHastaPrestamoInput.value;
        currentPrestamoPage = 1;
        renderPrestamosTable(currentPrestamoPage);
        prestamosLoaded = true;
    };

    if (fechaDesdePrestamoInput) fechaDesdePrestamoInput.addEventListener('change', handleFechaPrestamoChange);
    if (fechaHastaPrestamoInput) fechaHastaPrestamoInput.addEventListener('change', handleFechaPrestamoChange);

    if (btnLimpiarFechasPrestamo) {
        btnLimpiarFechasPrestamo.addEventListener('click', () => {
            if (fechaDesdePrestamoInput) fechaDesdePrestamoInput.value = '';
            if (fechaHastaPrestamoInput) fechaHastaPrestamoInput.value = '';
            currentPrestamoFechaDesde = '';
            currentPrestamoFechaHasta = '';
            currentPrestamoPage = 1;
            renderPrestamosTable(currentPrestamoPage);
            prestamosLoaded = true;
        });
    }
});
