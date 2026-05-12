import { reservasService } from '../services/reservasService.js';
import { articulosService } from '../services/articulosService.js';
import { prestamosService } from '../services/prestamosService.js';

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

/**
 * Lee el ID de la reserva desde la cadena de consulta URL (?id=XX).
 */
const getReservaIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
};

/**
 * Devuelve el HTML de la insignia de estado coincidente.
 */
const buildEstadoBadge = (estado) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('pendiente'))  return { cls: 'status-badge--pending',  icon: 'fa-clock',         label: 'Pendiente'  };
  if (s.includes('vencida'))    return { cls: 'status-badge--rejected', icon: 'fa-clock',         label: 'Vencida'    };
  if (s.includes('rechazada') || s.includes('cancelada'))
                                return { cls: 'status-badge--rejected', icon: 'fa-times-circle',  label: estado       };
  if (s.includes('aprobada') || s.includes('completada'))
                                return { cls: 'status-badge--approved', icon: 'fa-check-circle',  label: estado       };
  return { cls: 'status-badge--default', icon: '', label: estado || '—' };
};

/**
 * Construye eventos de línea de tiempo basados en los datos de la reserva.
 */
const buildTimeline = async (reserva) => {
  const events = [];
  let prestamo;

  // Solicitado (siempre presente — fecha_inicio)
  if (reserva.fecha_inicio) {
    events.push({ title: 'Solicitado', date: reserva.fecha_inicio });
  }

  // Aprobado
  if (reserva.estado.toLowerCase().includes('completada')) {
    try {
      const response = await prestamosService.getPrestamoByEjemplarId(reserva.ejemplar_id);
      prestamo = response.data || response;
      events.push({ title: 'Aprobada', date: prestamo.fecha_prestamo });
    } catch (error) {
      console.error('Error al obtener el préstamo:', error);
    }
  }

  // Entregado / Completada
  if (reserva.estado.toLowerCase().includes('completada')) {
    events.push({ title: 'Entregado', date: prestamo.fecha_prestamo });
  }

  // Cancelada / Rechazada
  if (reserva.estado.toLowerCase().includes('cancelada') || reserva.estado.toLowerCase().includes('rechazada')) {
    events.push({ title: 'Cancelada', date: reserva.fecha_vencimiento });
  }

  if(reserva.estado.toLowerCase().includes('vencida')) {
    events.push({ title: 'Vencida', date: reserva.fecha_vencimiento });
  }

  // Reverse so the most recent event is at the top
  return events.reverse();
};

/**
 * Renders the timeline into the container.
 */
const renderTimeline = (container, events) => {
  container.innerHTML = '';
  events.forEach((ev, i) => {
    const isActive = i === 0; // most recent
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

/**
 * Renders librarian notes (mock — backend may not expose this yet).
 */
const renderNotes = (container, reserva) => {
  const emptyEl = document.getElementById('rdNotesEmpty');
  const notes = reserva.notas || reserva.notes || [];

  if (typeof notes === 'string' && notes.trim()) {
    if (emptyEl) emptyEl.remove();
    const noteEl = document.createElement('div');
    noteEl.className = 'rd-note';
    noteEl.innerHTML = `
      <p class="rd-note__text">${notes}</p>
      <p class="rd-note__author">— Admin, ${reserva.updated_at || reserva.fecha_inicio || ''}</p>
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
    return;
  }

  // No notas — deja visible el estado vacío
};

/**
 * Mapea una condición física a una clase de color de punto.
 */
const getEstadoFisicoDot = (estado) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('excelente') || s.includes('bueno') || s.includes('bien')) return 'rd-dot--green';
  if (s.includes('regular') || s.includes('aceptable')) return 'rd-dot--yellow';
  if (s.includes('malo') || s.includes('dañado') || s.includes('deteriorado')) return 'rd-dot--red';
  return 'rd-dot--green';
};

// ── Main Load ───────────────────────────────────────────────────────────────

const loadReservaDetail = async () => {
  const id = getReservaIdFromUrl();
  if (!id) {
    showError('No se especificó un ID de reserva.');
    return;
  }

  // Set breadcrumb right away
  document.getElementById('breadcrumbCurrent').textContent = `Detalles #R-${id}`;
  document.getElementById('rdId').textContent = `#R-${id}`;

  try {
    // Fetch reservation data
    const response = await reservasService.getReservaById(id);
    const reserva = response?.data || response || {};

    // ── Header ──
    const estado = reserva.estado || reserva.estado_reserva || '—';
    const badge = buildEstadoBadge(estado);
    const badgeEl = document.getElementById('rdEstadoBadge');
    badgeEl.className = `status-badge ${badge.cls}`;
    badgeEl.innerHTML = badge.icon ? `<i class="fas ${badge.icon}" style="margin-right:4px;"></i> ${badge.label}` : badge.label;

    //Posible mejora si se quiere, incluir en la respuesta del backend el atributo updated_at
    const updatedAt = reserva.updated_at || reserva.fecha_actualizacion || reserva.fecha_fin || '—';
    document.getElementById('rdMeta').textContent = `Última actualización: ${updatedAt}`;

    // ── Información del Usuario ──
    // Mejorar mostrando datos del lector. Requiere creacion de endpoint en el backend para obtener dichos datos.
    document.getElementById('rdUsuario').textContent = reserva.nombre_usuario || reserva.usuario_nombre || `Lector ${reserva.lector_id || '—'}`;
    document.getElementById('rdUsuarioId').textContent = reserva.lector_id || reserva.usuario_id || '—';
    document.getElementById('rdEmail').textContent = reserva.email_usuario || reserva.email || '—';
    document.getElementById('rdCarrera').textContent = reserva.carrera || reserva.carrera_usuario || '—';

    // ── Detalles del Artículo ──
    let articulo = {};
    if (reserva.articulo_id) {
      try {
        articulo = await articulosService.getArticuloById(reserva.articulo_id);
      } catch (e) {
        console.warn('No se pudo obtener el artículo:', e);
      }
    }

    const tituloLibro = articulo.titulo || reserva.titulo_articulo || '—';
    const anio = articulo.anio_publicacion ? ` (${articulo.anio_publicacion})` : '';
    document.getElementById('rdLibro').textContent = `${tituloLibro}${anio}`;
    document.getElementById('rdIsbn').textContent = articulo.isbn || articulo.issn || '—';
    document.getElementById('rdCategoria').textContent = articulo.categoria || articulo.tipo_documento || '—';

    const estadoFisico = articulo.estado_fisico || reserva.estado_fisico || 'Excelente';
    const dotClass = getEstadoFisicoDot(estadoFisico);
    document.getElementById('rdEstadoFisico').innerHTML = `<span class="rd-dot ${dotClass}"></span> ${estadoFisico}`;

    // ── Timeline ──
    const timelineContainer = document.getElementById('rdTimeline');
    const events = await buildTimeline(reserva);
    if (events.length > 0) {
      renderTimeline(timelineContainer, events);
    } else {
      timelineContainer.innerHTML = '<p style="color:var(--color-gray-500); font-size:var(--font-size-sm);">Sin eventos registrados.</p>';
    }

    // ── Fecha Límite ──
    if(estado.toLowerCase().includes('completada') || estado.toLowerCase().includes('cancelada') || estado.toLowerCase().includes('vencida')) {
      document.getElementById('rdDeadlineBox').style.display = "none";
    }

    // ── Notas del Bibliotecario ──
    const notesContainer = document.getElementById('rdNotes');
    renderNotes(notesContainer, reserva);

  } catch (error) {
    console.error('Error al cargar detalle de reserva:', error);
    showError('No se pudo cargar la información de la reserva.');
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
          <i class="fas fa-arrow-left"></i> Volver a Reservas
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
  loadReservaDetail();
});
