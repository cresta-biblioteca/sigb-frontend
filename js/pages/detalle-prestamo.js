import { prestamosService } from '../services/prestamosService.js';
import { ejemplaresService } from '../services/ejemplaresService.js';
import { articulosService } from '../services/articulosService.js';

// ── Sidebar toggle (mobile) ────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const getPrestamoIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
};

/**
 * Devuelve la config del badge según el estado del préstamo.
 */
const buildEstadoBadge = (estado) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('vigente'))
    return { cls: 'status-badge--active', icon: 'fa-book-reader', label: 'Vigente' };
  if (s.includes('completado_vencido'))
    return { cls: 'status-badge--overdue', icon: 'fa-exclamation-triangle', label: 'Vencido' };
  if (s.includes('completado_exito'))
    return { cls: 'status-badge--returned', icon: 'fa-undo-alt', label: 'Devuelto' };
  return { cls: 'status-badge--default', icon: '', label: estado || '—' };
};

/**
 * Calcula los días restantes entre hoy y la fecha de vencimiento.
 */
const calcDiasRestantes = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const diff = venc - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Construye eventos de línea de tiempo para el préstamo.
 */
const buildTimeline = (prestamo) => {
  const events = [];

  if (prestamo.fecha_prestamo) {
    events.push({ title: 'Préstamo realizado', date: prestamo.fecha_prestamo });
  }

  if (prestamo.renovaciones && prestamo.renovaciones > 0) {
    events.push({ title: `Renovado (${prestamo.renovaciones}x)`, date: prestamo.fecha_vencimiento });
  }

  const estado = (prestamo.estado || '').toLowerCase();

  if (estado.includes('completado_exito') && prestamo.fecha_devolucion) {
    events.push({ title: 'Devuelto', date: prestamo.fecha_devolucion });
  }

  if (estado.includes('completado_vencido')) {
    events.push({
      title: 'Vencido',
      date: prestamo.fecha_devolucion || prestamo.fecha_vencimiento
    });
  }

  return events.reverse();
};

const renderTimeline = (container, events) => {
  container.innerHTML = '';
  events.forEach((ev, i) => {
    const isActive = i === 0;
    const div = document.createElement('div');
    div.className = `rd-timeline-event${isActive ? ' rd-timeline-event--active' : ''}`;
    div.innerHTML = `
      <div class="rd-timeline-event__dot"></div>
      <p class="rd-timeline-event__title">${ev.title}</p>
      <p class="rd-timeline-event__date">${ev.date}</p>
    `;
    container.appendChild(div);
  });
};

const renderNotes = (container, prestamo) => {
  const emptyEl = document.getElementById('dpNotesEmpty');
  const notes = prestamo.notas || prestamo.notes || [];

  if (typeof notes === 'string' && notes.trim()) {
    if (emptyEl) emptyEl.remove();
    const noteEl = document.createElement('div');
    noteEl.className = 'rd-note';
    noteEl.innerHTML = `
      <p class="rd-note__text">${notes}</p>
      <p class="rd-note__author">— Admin, ${prestamo.updated_at || prestamo.fecha_prestamo || ''}</p>
    `;
    container.prepend(noteEl);
    return;
  }

  if (Array.isArray(notes) && notes.length > 0) {
    if (emptyEl) emptyEl.remove();
    notes.forEach(n => {
      const noteEl = document.createElement('div');
      noteEl.className = 'rd-note';
      noteEl.innerHTML = `
        <p class="rd-note__text">${n.texto || n.text || n}</p>
        <p class="rd-note__author">— ${n.autor || n.author || 'Admin'}, ${n.fecha || n.date || ''}</p>
      `;
      container.prepend(noteEl);
    });
  }
};

const getEstadoFisicoDot = (estado) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('excelente') || s.includes('bueno') || s.includes('bien')) return 'rd-dot--green';
  if (s.includes('regular') || s.includes('aceptable')) return 'rd-dot--yellow';
  if (s.includes('malo') || s.includes('dañado') || s.includes('deteriorado')) return 'rd-dot--red';
  return 'rd-dot--green';
};

// ── Status Card ─────────────────────────────────────────────────────────────

const renderStatusCard = (prestamo) => {
  const card  = document.getElementById('dpStatusCard');
  const icon  = document.getElementById('dpStatusIcon');
  const label = document.getElementById('dpStatusLabel');
  const value = document.getElementById('dpStatusValue');
  const estado = (prestamo.estado || '').toLowerCase();

  if (estado.includes('completado_exito')) {
    card.className = 'dp-status-card dp-status-card--returned';
    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
    label.textContent = 'ESTADO';
    value.textContent = 'Devuelto exitosamente';
    return;
  }

  if (estado.includes('completado_vencido')) {
    card.className = 'dp-status-card dp-status-card--overdue';
    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    label.textContent = 'ESTADO';
    value.textContent = 'Devuelto con retraso';
    return;
  }

  // Vigente — mostrar countdown
  const dias = calcDiasRestantes(prestamo.fecha_vencimiento);
  if (dias !== null && dias < 0) {
    card.className = 'dp-status-card dp-status-card--overdue';
    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    label.textContent = 'VENCIDO HACE';
    value.textContent = `${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
  } else if (dias !== null) {
    label.textContent = 'DÍAS RESTANTES';
    value.textContent = `${dias} día${dias !== 1 ? 's' : ''}`;
    if (dias <= 2) {
      card.className = 'dp-status-card dp-status-card--overdue';
      icon.innerHTML = '<i class="fas fa-hourglass-end"></i>';
    }
  }
};

// ── Action buttons visibility ───────────────────────────────────────────────

const configureActions = (prestamo) => {
  const estado = (prestamo.estado || '').toLowerCase();
  const btnReturn = document.getElementById('btnReturn');

  if (estado.includes('vigente')) {
    btnReturn.style.display = '';
  }
};

// ── Main Load ───────────────────────────────────────────────────────────────

const loadPrestamoDetail = async () => {
  const id = getPrestamoIdFromUrl();
  if (!id) {
    showError('No se especificó un ID de préstamo.');
    return;
  }

  document.getElementById('breadcrumbCurrent').textContent = `Detalles #P-${id}`;
  document.getElementById('dpId').textContent = `#P-${id}`;

  try {
    const response = await prestamosService.getPrestamoById(id);
    const prestamo = response?.data || response || {};

    // ── Header badge ──
    const estado = prestamo.estado || '—';
    const badge = buildEstadoBadge(estado);
    const badgeEl = document.getElementById('dpEstadoBadge');
    badgeEl.className = `status-badge ${badge.cls}`;
    badgeEl.innerHTML = badge.icon
      ? `<i class="fas ${badge.icon}" style="margin-right:4px;"></i> ${badge.label}`
      : badge.label;

    const updatedAt = prestamo.updated_at || prestamo.fecha_devolucion || prestamo.fecha_prestamo || '—';
    document.getElementById('dpMeta').textContent = `Última actualización: ${updatedAt}`;

    // ── Información del Lector ──
    document.getElementById('dpUsuario').textContent =
      prestamo.nombre_usuario || `${prestamo?.lector.nombre} ${prestamo?.lector.apellido}`|| `Lector ${prestamo.lector_id || '—'}`;
    document.getElementById('dpUsuarioId').textContent = prestamo.lector_id || prestamo.usuario_id || '—';
    document.getElementById('dpEmail').textContent = prestamo.email_usuario || prestamo.email || '—';
    document.getElementById('dpCarrera').textContent = prestamo.carrera || prestamo.carrera_usuario || '—';

    // ── Detalles del Préstamo ──
    document.getElementById('dpTipoPrestamo').textContent =
      prestamo.tipo_prestamo?.descripcion || prestamo.tipo || '—';
    document.getElementById('dpFechaPrestamo').textContent =
      prestamo.fecha_prestamo || '—';
    document.getElementById('dpFechaVencimiento').textContent =
      prestamo.fecha_vencimiento || prestamo.fechaVencimiento || '—';
    document.getElementById('dpFechaDevolucion').textContent =
      prestamo.fecha_devolucion || prestamo.fechaDevolucion || 'Pendiente';
    document.getElementById('dpRenovaciones').textContent =
      prestamo.max_renovaciones != null ? prestamo.max_renovaciones : '0';
    // Reserva asociada
    const reservaId = prestamo.reserva_id || prestamo.reservaId;
    const reservaEl = document.getElementById('dpReservaAsociada');
    if (reservaId) {
      reservaEl.innerHTML = `<a href="detalle-reserva.html?id=${reservaId}" class="dp-reserva-link">#R-${reservaId}</a>`;
    } else {
      reservaEl.textContent = '—';
    }

    // ── Detalles del Ejemplar ──
    let ejemplar = {};
    let articulo = {};
    if (prestamo.ejemplar_id) {
      try {
        const ejResp = await ejemplaresService.getEjemplarById(prestamo.ejemplar_id);
        ejemplar = ejResp?.data || ejResp || {};
      } catch (e) {
        console.warn('No se pudo obtener el ejemplar:', e);
      }
    }

    if (ejemplar.articulo_id) {
      try {
        articulo = await articulosService.getArticuloById(ejemplar.articulo_id);
      } catch (e) {
        console.warn('No se pudo obtener el artículo:', e);
      }
    }

    const tituloLibro = articulo.titulo || prestamo.titulo_articulo || '—';
    const anio = articulo.anio_publicacion ? ` (${articulo.anio_publicacion})` : '';
    document.getElementById('dpLibro').textContent = `${tituloLibro}${anio}`;
    document.getElementById('dpSignatura').textContent =
      ejemplar.signatura_topografica || '—';
    document.getElementById('dpCodigoBarras').textContent =
      ejemplar.codigo_barras || '—';

    const estadoFisico = ejemplar.estado_fisico || articulo.estado_fisico || 'Excelente';
    const dotClass = getEstadoFisicoDot(estadoFisico);
    document.getElementById('dpEstadoFisico').innerHTML =
      `<span class="rd-dot ${dotClass}"></span> ${estadoFisico}`;

    // ── Status Card ──
    renderStatusCard(prestamo);

    // ── Timeline ──
    const timelineContainer = document.getElementById('dpTimeline');
    const events = buildTimeline(prestamo);
    if (events.length > 0) {
      renderTimeline(timelineContainer, events);
    } else {
      timelineContainer.innerHTML =
        '<p style="color:var(--color-gray-500); font-size:var(--font-size-sm);">Sin eventos registrados.</p>';
    }

    // ── Notas ──
    const notesContainer = document.getElementById('dpNotes');
    renderNotes(notesContainer, prestamo);

    // ── Actions ──
    configureActions(prestamo);

    // ── Devolver ──
    document.getElementById('btnReturn')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnReturn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      btn.disabled = true;
      try {
        await prestamosService.marcarDevuelto(id);
        location.reload();
      } catch (error) {
        console.error('Error al devolver:', error);
        alert('Error al registrar la devolución.');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });

  } catch (error) {
    console.error('Error al cargar detalle de préstamo:', error);
    showError('No se pudo cargar la información del préstamo.');
  }
};

const showError = (message) => {
  const content = document.querySelector('.rd-grid');
  if (content) {
    content.innerHTML = `
      <div class="rd-error" style="grid-column: 1 / -1;">
        <div class="rd-error__icon"><i class="fas fa-exclamation-circle"></i></div>
        <p class="rd-error__title">Error</p>
        <p class="rd-error__desc">${message}</p>
        <a href="gestion-circulacion.html" class="btn btn--outline" style="margin-top: var(--spacing-md);">
          <i class="fas fa-arrow-left"></i> Volver a Préstamos
        </a>
      </div>
    `;
  }
};

// ── Botón de impresión ──
document.getElementById('btnPrint')?.addEventListener('click', () => {
  window.print();
});

// ── Inicio ──
document.addEventListener('DOMContentLoaded', () => {
  loadPrestamoDetail();
});
