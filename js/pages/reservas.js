import { reservasService } from '../services/reservasService.js';
import { articulosService } from '../services/articulosService.js';
import { prestamosService } from '../services/prestamosService.js';

const ITEMS_PER_PAGE = 10;
let currentReservaPage = 1;
let currentReservaFilter = 'todas';
let currentFechaDesde = '';
let currentFechaHasta = '';

const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// ── Sidebar toggle (mobile) ────────────────────────────────────────────────
sidebarToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('admin-sidebar--open');
});

document.addEventListener('click', (e) => {
  if (
    sidebar?.classList.contains('admin-sidebar--open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('admin-sidebar--open');
  }
});

// --- HELPERS ---
const getEstadoBadge = (estado) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower.includes('pendiente')) {
        return `<span class="status-badge status-badge--pending"><i class="fas fa-clock" style="margin-right: 4px;"></i> Pendiente</span>`;
    } else if (estadoLower.includes('vencida')) {
        return `<span class="status-badge status-badge--rejected"><i class="fas fa-clock" style="margin-right: 4px;"></i> Vencida</span>`;
    } else if (estadoLower.includes('rechazada') || estadoLower.includes('cancelada')) {
        return `<span class="status-badge status-badge--rejected"><i class="fas fa-times-circle" style="margin-right: 4px;"></i> ${estado}</span>`;
    } else if (estadoLower.includes('aprobada') || estadoLower.includes('completada')) {
        return `<span class="status-badge status-badge--approved"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> ${estado}</span>`;
    } else {
        return `<span class="status-badge status-badge--default">${estado || '-'}</span>`;
    }
};

// --- RENDER LOGIC ---
const renderReservasTable = async (page) => {
    const tbody = document.getElementById('tbodyReservas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Cargando reservas...</td></tr>';

    try {
        const response = await reservasService.getReservas(page, ITEMS_PER_PAGE, currentReservaFilter, currentFechaDesde, currentFechaHasta);

        const data = response?.data || response || [];
        const totalItems = response?.pagination?.total || data.length;

        tbody.innerHTML = '';

        if (data.length === 0) {
             tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-gray-500);">No hay reservas para mostrar.</td></tr>';
             renderPagination('reservasPagination', 0, page, () => {});
             return;
        }

        data.forEach(async item => {
            const articulo = await articulosService.getArticuloById(item.articulo_id);
            
            const tr = document.createElement('tr');
            const id = item.id || '-';
            // Adapt to the new HTML layout as best as possible
            const usuario_id = item.lector_id || item.nombre_usuario || '-';
            const estado = item.estado || item.estado_reserva || 'Pendiente';
            const articuloTitulo = articulo.titulo || 'Artículo Desconocido';
            const articuloSub = articulo.anio_publicacion || '';
            const fechaSolicitado = item.fecha_inicio || '-';

            tr.innerHTML = `
                <td class="circ-id">#R-${id}</td>
                <td>
                    <div class="circ-user-cell">
                        <p class="circ-user-cell__name">${usuario_id}</p>
                    </div>
                </td>
                <td>
                    <div class="circ-article-cell">
                        <p class="circ-article-cell__title">${articuloTitulo}</p>
                        <p class="circ-article-cell__sub">${articuloSub}</p>
                    </div>
                </td>
                <td class="circ-date">${fechaSolicitado}</td>
                <td>${getEstadoBadge(estado)}</td>
                <td>
                    <div class="circ-actions">
                        ${estado.toLowerCase().includes('pendiente') ? `
                        <button class="btn-action btn-action--approve" title="Aprobar y generar préstamo" data-id="${id}">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn-action btn-action--reject" title="Rechazar reserva" data-id="${id}">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        ` : `
                        <button class="btn-action btn-action--view" title="Ver detalle" data-id="${id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('reservasPagination', totalItems, page, (newPage) => {
            currentReservaPage = newPage;
            renderReservasTable(newPage);
        });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-error);"><i class="fas fa-exclamation-circle"></i> Error al cargar los datos.</td></tr>';
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
        if(i === currentPage) pageBtn.setAttribute('disabled', true);
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

const loadTiposPrestamos = async () => {
    try {
        const response = await prestamosService.getTiposPrestamos();
        const tipos = response?.data || response || [];
        const select = document.getElementById('modalTipoPrestamo');
        if (!select) return;
        
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre || tipo.descripcion || `Tipo ${tipo.id}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar tipos de préstamos:', error);
    }
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    renderReservasTable(currentReservaPage);
    loadTiposPrestamos();

    // Lógica de filtros
    const filterGroup = document.querySelector('#panel-reservas .circ-filters');
    if (filterGroup) {
        const filters = filterGroup.querySelectorAll('.circ-filter');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                if (filter && filter !== currentReservaFilter) {
                    currentReservaFilter = filter;
                    currentReservaPage = 1;
                    renderReservasTable(currentReservaPage);
                }
            });
        });
    }

    // Lógica de fechas
    const fechaDesdeInput = document.getElementById('reservaFechaDesde');
    const fechaHastaInput = document.getElementById('reservaFechaHasta');
    const btnLimpiarFechas = document.getElementById('btnLimpiarFechasReservas');

    const handleFechaChange = () => {
        currentFechaDesde = fechaDesdeInput.value;
        currentFechaHasta = fechaHastaInput.value;
        currentReservaPage = 1;
        renderReservasTable(currentReservaPage);
    };

    if (fechaDesdeInput) fechaDesdeInput.addEventListener('change', handleFechaChange);
    if (fechaHastaInput) fechaHastaInput.addEventListener('change', handleFechaChange);

    if (btnLimpiarFechas) {
        btnLimpiarFechas.addEventListener('click', () => {
            if (fechaDesdeInput) fechaDesdeInput.value = '';
            if (fechaHastaInput) fechaHastaInput.value = '';
            currentFechaDesde = '';
            currentFechaHasta = '';
            currentReservaPage = 1;
            renderReservasTable(currentReservaPage);
        });
    }

    // Modal de Aprobar Reserva
    let currentReservaAprobarId = null;

    // Navegación a detalle de reserva
    document.getElementById('tbodyReservas')?.addEventListener('click', (e) => {
        const btnView = e.target.closest('.btn-action--view');
        if (btnView) {
            const id = btnView.getAttribute('data-id');
            window.location.href = `detalle-reserva.html?id=${id}`;
        }
    });

    document.getElementById('tbodyReservas')?.addEventListener('click', (e) => {
        const btnApprove = e.target.closest('.btn-action--approve');
        if (btnApprove) {
            const id = btnApprove.getAttribute('data-id');
            const tr = btnApprove.closest('tr');
            const usuarioName = tr.querySelector('.circ-user-cell__name')?.textContent || '-';
            const articuloTitle = tr.querySelector('.circ-article-cell__title')?.textContent || '-';
            
            currentReservaAprobarId = id;
            document.getElementById('modalAprobarUsuario').textContent = usuarioName;
            document.getElementById('modalAprobarArticulo').textContent = articuloTitle;
            document.getElementById('modalTipoPrestamo').value = '';
            document.getElementById('modalTipoError').textContent = '';
            
            // Add inline style display to show modal
            const overlay = document.getElementById('modalAprobarOverlay');
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');
        }
    });

    const closeModalAprobar = () => {
        const overlay = document.getElementById('modalAprobarOverlay');
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        currentReservaAprobarId = null;
    };

    document.getElementById('btnCloseModalAprobar')?.addEventListener('click', closeModalAprobar);
    document.getElementById('btnCancelarAprobar')?.addEventListener('click', closeModalAprobar);

    document.getElementById('btnConfirmarAprobar')?.addEventListener('click', async () => {
        if (!currentReservaAprobarId) return;
        
        const tipoPrestamoId = document.getElementById('modalTipoPrestamo').value;
        if (!tipoPrestamoId) {
            document.getElementById('modalTipoError').textContent = 'Debe seleccionar un tipo de préstamo.';
            return;
        }
        
        const btnConfirm = document.getElementById('btnConfirmarAprobar');
        const originalText = btnConfirm.innerHTML;
        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btnConfirm.disabled = true;

        try {
            await prestamosService.crearPrestamo({
                reserva_id: currentReservaAprobarId,
                tipo_prestamo_id: parseInt(tipoPrestamoId, 10)
            });
            
            closeModalAprobar();
            renderReservasTable(currentReservaPage);
        } catch (error) {
            console.error("Error al aprobar reserva:", error);
            document.getElementById('modalTipoError').textContent = 'Error al aprobar la reserva.';
        } finally {
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
        }
    });

    // Modal de Rechazar Reserva
    let currentReservaRechazarId = null;

    document.getElementById('tbodyReservas')?.addEventListener('click', (e) => {
        const btnReject = e.target.closest('.btn-action--reject');
        if (btnReject) {
            const id = btnReject.getAttribute('data-id');
            const tr = btnReject.closest('tr');
            const usuarioName = tr.querySelector('.circ-user-cell__name')?.textContent || '-';
            const articuloTitle = tr.querySelector('.circ-article-cell__title')?.textContent || '-';
            
            currentReservaRechazarId = id;
            document.getElementById('modalRechazarUsuario').textContent = usuarioName;
            document.getElementById('modalRechazarArticulo').textContent = articuloTitle;
            document.getElementById('modalMotivoRechazo').value = '';
            document.getElementById('modalMotivoError').textContent = '';
            
            const overlay = document.getElementById('modalRechazarOverlay');
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');
        }
    });

    const closeModalRechazar = () => {
        const overlay = document.getElementById('modalRechazarOverlay');
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        currentReservaRechazarId = null;
    };

    document.getElementById('btnCloseModalRechazar')?.addEventListener('click', closeModalRechazar);
    document.getElementById('btnCancelarRechazar')?.addEventListener('click', closeModalRechazar);

    document.getElementById('btnConfirmarRechazar')?.addEventListener('click', async () => {
        if (!currentReservaRechazarId) return;
        
        const motivo = document.getElementById('modalMotivoRechazo').value.trim();
        if (!motivo) {
            document.getElementById('modalMotivoError').textContent = 'Debe ingresar un motivo de rechazo.';
            return;
        }
        
        const btnConfirm = document.getElementById('btnConfirmarRechazar');
        const originalText = btnConfirm.innerHTML;
        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btnConfirm.disabled = true;

        try {
            await reservasService.rechazarReserva(currentReservaRechazarId, { motivo });
            
            closeModalRechazar();
            renderReservasTable(currentReservaPage);
        } catch (error) {
            console.error("Error al rechazar reserva:", error);
            document.getElementById('modalMotivoError').textContent = 'Error al rechazar la reserva.';
        } finally {
            btnConfirm.innerHTML = originalText;
            btnConfirm.disabled = false;
        }
    });
});