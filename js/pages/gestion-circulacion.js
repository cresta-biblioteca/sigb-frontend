import { reservasService } from '../services/reservasService.js';
import { prestamosService } from '../services/prestamosService.js';

export const setupTabs = () => {
    const tabs = document.querySelectorAll('.circ-tab');
    const panels = document.querySelectorAll('.circ-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Quitar active de todos
            tabs.forEach(t => {
                t.classList.remove('circ-tab--active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => p.classList.remove('circ-panel--active'));

            // Activar el seleccionado
            tab.classList.add('circ-tab--active');
            tab.setAttribute('aria-selected', 'true');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`panel-${target}`).classList.add('circ-panel--active');
        });
    });
};

export const setupFilters = () => {
    const filterGroups = document.querySelectorAll('.circ-filters');
    filterGroups.forEach(group => {
        const filters = group.querySelectorAll('.circ-filter');
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('circ-filter--active'));
                filter.classList.add('circ-filter--active');
            });
        });
    });
};

export const updateCirculationStats = async () => {
    try {
        // Obtenemos una lista amplia para calcular las estadísticas globales
        const reservasResponse = await reservasService.getReservas(1, 1000);
        const prestamosResponse = await prestamosService.getPrestamos(1, 1000);
        
        const reservas = reservasResponse?.data || reservasResponse || [];
        const prestamos = prestamosResponse?.data || prestamosResponse || [];

        // --- Stats Reservas ---
        const totalReservas = reservasResponse?.total || reservas.length || 0;
        let reservasPendientes = 0;

        for (const item of reservas) {
            let estado = item.estado || item.estado_reserva;

            if (estado.toLowerCase() === 'pendiente') {
                reservasPendientes++;
            }
        }

        // --- Stats Prestamos ---
        const totalPrestamos = prestamosResponse?.total || prestamos.length || 0;
        let prestamosVencidos = 0;
        let prestamosActivos = 0;
        let devueltosHoy = 0;

        for (const item of prestamos) {
            // Obtenemos el detalle real del préstamo para ver su estado
            let estado = item.estado || item.estado_prestamo;
            
            const estadoLower = estado.toLowerCase();
            
            if (estadoLower === 'completado_vencido') {
                prestamosVencidos++;
            } else if (estadoLower === 'vigente') {
                prestamosActivos++;
            } else if (estadoLower === 'completado_exito') {
                if (item.fecha_devolucion) {
                    // Extraemos solo la parte de la fecha (AAAA-MM-DD) ignorando la hora
                    const fechaDev = item.fecha_devolucion.split(' ')[0];
                    
                    // Formateamos la fecha actual al mismo formato AAAA-MM-DD
                    const hoy = new Date();
                    const year = hoy.getFullYear();
                    const month = String(hoy.getMonth() + 1).padStart(2, '0');
                    const day = String(hoy.getDate()).padStart(2, '0');
                    const hoyStr = `${year}-${month}-${day}`;
                    
                    if (fechaDev === hoyStr) {
                        devueltosHoy++;
                    }
                }
            }
        }

        // --- DOM Update ---
        // Pestaña y panel de reservas
        const badgeReservas = document.getElementById('badgeReservasPendientes');
        if (badgeReservas) badgeReservas.textContent = totalReservas;

        const countPendientes = document.getElementById('countPendientes');
        if (countPendientes) countPendientes.textContent = reservasPendientes;

        // Pestaña y panel de préstamos
        const badgePrestamos = document.getElementById('badgePrestamosVencidos');
        if (badgePrestamos) badgePrestamos.textContent = totalPrestamos;

        const countVencidos = document.getElementById('countVencidos');
        if (countVencidos) countVencidos.textContent = prestamosVencidos;

        // Stats globales superiores
        const statReservasPendientes = document.getElementById('statReservasPendientes');
        if (statReservasPendientes) statReservasPendientes.textContent = reservasPendientes;

        const statPrestamosActivos = document.getElementById('statPrestamosActivos');
        if (statPrestamosActivos) statPrestamosActivos.textContent = prestamosActivos;

        const statVencidosHeader = document.getElementById('statVencidos');
        if (statVencidosHeader) statVencidosHeader.textContent = prestamosVencidos;

        const statDevueltosHoy = document.getElementById('statDevueltosHoy');
        if (statDevueltosHoy) statDevueltosHoy.textContent = devueltosHoy;

    } catch (error) {
        console.error("Error al actualizar estadísticas de circulación:", error);
    }
};

// Escuchamos un evento global para recargar las estadísticas desde otras páginas o modales
document.addEventListener('actualizar-stats-circulacion', updateCirculationStats);

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupFilters();
    updateCirculationStats();
});
