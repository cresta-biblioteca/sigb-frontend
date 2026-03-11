/**
 * Datos mock de usuarios para pruebas de frontend.
 * Incluye lectores, administradores, estados de cuenta y prestamos.
 */

const USUARIOS_MOCK = [
	{
		id: 'USR-0001',
		legajo: 'A2023001',
		nombre: 'Valentina',
		apellido: 'Suarez',
		dni: '38111444',
		email: 'valentina.suarez@cresta.edu.ar',
		telefono: '+54 11 5234 9012',
		password: 'demo1234',
		rol: 'lector',
		estado: 'activo',
		carrera: 'Ingenieria en Sistemas',
		sede: 'Sede Centro',
		fechaAlta: '2024-03-12',
		ultimoAcceso: '2026-03-10T18:20:00',
		multaPendiente: 0,
		maxPrestamos: 3,
		prestamosActivos: [
			{
				id: 'PRE-1001',
				libroId: 'LIB-0003',
				fechaPrestamo: '2026-03-01',
				fechaVencimiento: '2026-03-15',
				renovaciones: 0,
				estado: 'vigente'
			}
		],
		historialPrestamos: [
			{
				id: 'PRE-0955',
				libroId: 'LIB-0010',
				fechaPrestamo: '2025-11-04',
				fechaDevolucion: '2025-11-20',
				estado: 'devuelto'
			}
		]
	},
	{
		id: 'USR-0002',
		legajo: 'A2022008',
		nombre: 'Mateo',
		apellido: 'Benitez',
		dni: '35991321',
		email: 'mateo.benitez@cresta.edu.ar',
		telefono: '+54 11 4521 0923',
		password: 'demo1234',
		rol: 'lector',
		estado: 'activo',
		carrera: 'Enfermeria',
		sede: 'Sede Norte',
		fechaAlta: '2023-08-21',
		ultimoAcceso: '2026-03-09T09:11:00',
		multaPendiente: 4500,
		maxPrestamos: 2,
		prestamosActivos: [
			{
				id: 'PRE-1002',
				libroId: 'LIB-0005',
				fechaPrestamo: '2026-02-20',
				fechaVencimiento: '2026-03-05',
				renovaciones: 1,
				estado: 'vencido'
			},
			{
				id: 'PRE-1003',
				libroId: 'LIB-0014',
				fechaPrestamo: '2026-03-03',
				fechaVencimiento: '2026-03-17',
				renovaciones: 0,
				estado: 'vigente'
			}
		],
		historialPrestamos: []
	},
	{
		id: 'USR-0003',
		legajo: 'ADM-001',
		nombre: 'Camila',
		apellido: 'Arce',
		dni: '29110111',
		email: 'biblioteca@cresta.edu.ar',
		telefono: '+54 11 4000 0001',
		password: 'admin123',
		rol: 'administrador',
		estado: 'activo',
		carrera: 'Bibliotecologia',
		sede: 'Sede Central',
		fechaAlta: '2021-01-15',
		ultimoAcceso: '2026-03-11T08:00:00',
		multaPendiente: 0,
		maxPrestamos: 10,
		prestamosActivos: [],
		historialPrestamos: []
	},
	{
		id: 'USR-0004',
		legajo: 'DOC-034',
		nombre: 'Jorge',
		apellido: 'Molina',
		dni: '22888777',
		email: 'jorge.molina@cresta.edu.ar',
		telefono: '+54 11 4881 1022',
		password: 'demo1234',
		rol: 'docente',
		estado: 'activo',
		carrera: 'Derecho',
		sede: 'Sede Sur',
		fechaAlta: '2022-05-05',
		ultimoAcceso: '2026-03-10T14:31:00',
		multaPendiente: 0,
		maxPrestamos: 5,
		prestamosActivos: [
			{
				id: 'PRE-1004',
				libroId: 'LIB-0018',
				fechaPrestamo: '2026-03-02',
				fechaVencimiento: '2026-03-23',
				renovaciones: 1,
				estado: 'vigente'
			}
		],
		historialPrestamos: [
			{
				id: 'PRE-0971',
				libroId: 'LIB-0001',
				fechaPrestamo: '2025-09-10',
				fechaDevolucion: '2025-09-24',
				estado: 'devuelto'
			}
		]
	},
	{
		id: 'USR-0005',
		legajo: 'A2024009',
		nombre: 'Lucia',
		apellido: 'Acosta',
		dni: '40123998',
		email: 'lucia.acosta@cresta.edu.ar',
		telefono: '+54 11 3990 5553',
		password: 'demo1234',
		rol: 'lector',
		estado: 'bloqueado',
		carrera: 'Psicologia',
		sede: 'Sede Centro',
		fechaAlta: '2024-04-02',
		ultimoAcceso: '2026-02-27T12:40:00',
		multaPendiente: 12000,
		maxPrestamos: 3,
		prestamosActivos: [
			{
				id: 'PRE-1005',
				libroId: 'LIB-0009',
				fechaPrestamo: '2026-01-18',
				fechaVencimiento: '2026-02-01',
				renovaciones: 0,
				estado: 'vencido'
			}
		],
		historialPrestamos: []
	},
	{
		id: 'USR-0006',
		legajo: 'A2021014',
		nombre: 'Nicolas',
		apellido: 'Ramirez',
		dni: '34222991',
		email: 'nicolas.ramirez@cresta.edu.ar',
		telefono: '+54 11 4777 0303',
		password: 'demo1234',
		rol: 'lector',
		estado: 'activo',
		carrera: 'Administracion',
		sede: 'Sede Oeste',
		fechaAlta: '2021-06-11',
		ultimoAcceso: '2026-03-06T20:05:00',
		multaPendiente: 0,
		maxPrestamos: 3,
		prestamosActivos: [],
		historialPrestamos: [
			{
				id: 'PRE-0932',
				libroId: 'LIB-0007',
				fechaPrestamo: '2025-07-13',
				fechaDevolucion: '2025-07-25',
				estado: 'devuelto'
			},
			{
				id: 'PRE-0940',
				libroId: 'LIB-0011',
				fechaPrestamo: '2025-08-01',
				fechaDevolucion: '2025-08-15',
				estado: 'devuelto'
			}
		]
	},
	{
		id: 'USR-0007',
		legajo: 'A2025011',
		nombre: 'Agustin',
		apellido: 'Paz',
		dni: '42111005',
		email: 'agustin.paz@cresta.edu.ar',
		telefono: '+54 11 5454 5454',
		password: 'demo1234',
		rol: 'lector',
		estado: 'activo',
		carrera: 'Contador Publico',
		sede: 'Sede Centro',
		fechaAlta: '2025-03-01',
		ultimoAcceso: '2026-03-11T00:10:00',
		multaPendiente: 0,
		maxPrestamos: 2,
		prestamosActivos: [
			{
				id: 'PRE-1006',
				libroId: 'LIB-0012',
				fechaPrestamo: '2026-03-08',
				fechaVencimiento: '2026-03-22',
				renovaciones: 0,
				estado: 'vigente'
			}
		],
		historialPrestamos: []
	},
	{
		id: 'USR-0008',
		legajo: 'A2023017',
		nombre: 'Milagros',
		apellido: 'Diaz',
		dni: '39999876',
		email: 'milagros.diaz@cresta.edu.ar',
		telefono: '+54 11 5888 1200',
		password: 'demo1234',
		rol: 'lector',
		estado: 'inactivo',
		carrera: 'Trabajo Social',
		sede: 'Sede Norte',
		fechaAlta: '2023-10-01',
		ultimoAcceso: '2025-12-15T16:40:00',
		multaPendiente: 0,
		maxPrestamos: 2,
		prestamosActivos: [],
		historialPrestamos: []
	}
];

// Indices rapidos para pruebas en UI
const USUARIOS_MOCK_POR_ID = Object.fromEntries(USUARIOS_MOCK.map(usuario => [usuario.id, usuario]));
const USUARIOS_MOCK_POR_EMAIL = Object.fromEntries(USUARIOS_MOCK.map(usuario => [usuario.email.toLowerCase(), usuario]));

if (typeof window !== 'undefined') {
	window.USUARIOS_MOCK = USUARIOS_MOCK;
	window.USUARIOS_MOCK_POR_ID = USUARIOS_MOCK_POR_ID;
	window.USUARIOS_MOCK_POR_EMAIL = USUARIOS_MOCK_POR_EMAIL;
}

