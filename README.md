# SIGB Frontend — Biblioteca CRESTA

Frontend del Sistema de Gestión Bibliotecaria (SIGB) para el Centro Regional de Estudios Superiores (CRESTA), Tres Arroyos.

## Stack

- **HTML, CSS, JavaScript vanilla** — sin frameworks, sin build tools
- **ES Modules** (`type="module"`) — imports nativos del browser
- **JWT** — autenticación stateless con token en `localStorage`
- **BEM** — convención de nomenclatura CSS
- **API REST** — backend en `/api/v1` (contrato en `endpoints-backend/endpoints.yml`)

## Estructura del proyecto

```
sigb-frontend/
├── index.html                   # Página principal: hero, búsqueda rápida, login
├── templates/
│   ├── book-detail.html         # Detalle de un libro
│   ├── catalog.html             # Catálogo de libros
│   ├── dashboard.html           # Panel del usuario autenticado
│   ├── mi-perfil.html           # Perfil del lector autenticado
│   ├── user-history.html        # Historial del lector autenticado
│   └── panel-staff/
│       ├── carga-articulos.html  # Alta e importación de artículos
│       ├── detalle-prestamo.html # Detalle de préstamo
│       ├── detalle-reserva.html  # Detalle de reserva
│       ├── gestion-circulacion.html # Gestión de préstamos y reservas
│       ├── gestion-usuarios.html # Gestión de usuarios
│       ├── login.html            # Login del staff
│       └── vista-general.html    # Vista general del panel staff
│
├── css/
│   ├── components.css            # Piezas reutilizables: botones, cards, inputs, search form
│   ├── layout.css                # Navbar, footer, container — compartido en todas las páginas
│   ├── reset.css                 # Normalización de defaults del browser
│   ├── variables.css             # Design tokens: colores, tipografía, espaciado
│   └── pages/
│       ├── bookDetail.css        # Estilos de detalle de libro
│       ├── carga-articulos.css   # Estilos de alta/importación de artículos
│       ├── catalog.css           # Estilos exclusivos de catalog.html
│       ├── dashboard.css         # Estilos exclusivos de dashboard.html
│       ├── detalle-prestamo.css  # Estilos de detalle de préstamo
│       ├── detalle-reserva.css   # Estilos de detalle de reserva
│       ├── gestion-circulacion.css # Gestión de circulación
│       ├── gestion-usuarios.css  # Gestión de usuarios
│       ├── home.css              # Estilos exclusivos de index.html (hero, login form, partners)
│       ├── mi-perfil.css         # Estilos del perfil del lector
│       ├── staff-login.css       # Estilos del login del staff
│       └── vista-general.css     # Estilos de la vista general del staff
│
├── js/
│   ├── components/
│   │   ├── footer.js             # Comportamiento del footer
│   │   ├── modal.js              # Modal reutilizable (confirm, alert)
│   │   ├── navbar.js             # Comportamiento del navbar (hamburguesa, dropdown)
│   │   └── ui.js                 # Estados visuales: showLoading, showError, showEmpty
│   ├── core/
│   │   ├── authGuard.js          # Protección de rutas: requireAuth(), requireGuest()
│   │   └── store.js              # Estado global de sesión (token JWT + usuario)
│   ├── pages/
│   │   ├── book-detail.js        # Lógica de book-detail.html
│   │   ├── carga-articulos.js    # Lógica de carga-articulos.html
│   │   ├── catalog.js            # Lógica de catalog.html
│   │   ├── dashboard.js          # Lógica de dashboard.html
│   │   ├── detalle-prestamo.js   # Lógica de detalle-prestamo.html
│   │   ├── detalle-reserva.js    # Lógica de detalle-reserva.html
│   │   ├── gestion-circulacion.js # Lógica de gestion-circulacion.html
│   │   ├── gestion-usuarios.js   # Lógica de gestion-usuarios.html
│   │   ├── home.js               # Lógica de index.html (login, búsqueda, accesibilidad)
│   │   ├── mi-perfil.js          # Lógica de mi-perfil.html
│   │   ├── prestamos.js          # Lógica del listado de préstamos
│   │   ├── reservas.js           # Lógica del listado de reservas
│   │   ├── staff-login.js        # Lógica de login.html
│   │   ├── user-history.js       # Lógica de user-history.html
│   │   └── vista-general.js      # Lógica de vista-general.html
│   └── services/
│       ├── api.js                # HTTP client — único lugar donde vive fetch()
│       ├── articulosService.js   # Gestión de artículos y MARC21
│       ├── authService.js        # Endpoints de autenticación: login, logout, register
│       ├── bibliographicResolver.js # Enriquecimiento bibliográfico
│       ├── ejemplaresService.js  # CRUD de ejemplares
│       ├── lectoresService.js    # Endpoint del perfil autenticado del lector
│       ├── libroService.js       # Lecturas de libros
│       ├── loansService.js       # Préstamos del lector autenticado
│       ├── prestamosService.js   # Gestión de préstamos del staff
│       ├── reservasService.js    # Gestión de reservas del staff
│       ├── reservationsService.js # Reservas del lector autenticado
│       └── usersService.js       # Usuarios del sistema
│
├── assets/                      # Imágenes y recursos estáticos
└── endpoints-backend/
    └── endpoints.yml            # OpenAPI spec del backend (referencia de contratos)
```

## Arquitectura

El proyecto es una **MPA (Multi-Page Application) estática**. Cada página es un archivo HTML independiente servido tal cual por el servidor. No hay SSR ni router del lado cliente.

### Capas JS

```
pages/*.js          orquesta la lógica específica de cada página
    ↓ importa
services/*.js       traduce verbos HTTP a intenciones de negocio
    ↓ importa
core/api.js         único fetch(), maneja headers, errores y sesión expirada
```

Capas transversales usadas desde cualquier nivel:

```
core/store.js       estado de sesión (token + usuario decodificado del JWT)
core/authGuard.js   verificación de autenticación al inicio de cada página protegida
components/ui.js    estados visuales reutilizables (loading, error, vacío, botón)
components/modal.js modal imperativo para alertas y confirmaciones
```

### Flujo de autenticación

```
1. Usuario llena el formulario en index.html
2. home.js llama authService.login({ dni, password })
3. authService llama api.post('/auth/login', body)
4. Backend responde { token }
5. store.setSession(token) persiste en localStorage y decodifica el JWT
6. Redirige a templates/dashboard.html

En templates/dashboard.html:
1. requireAuth() verifica sesión — redirige a index.html si no hay token válido
2. store.getUser() retorna los claims del JWT (nombre, rol, exp, etc.)
```

### Protección de rutas

```js
// Primera línea en cualquier página que requiera sesión
import { requireAuth } from '../core/authGuard.js';
requireAuth('../index.html');
```

El guard inicializa el store internamente; no es necesario llamar `store.init()` por separado.

## Correr localmente

No hay build step. Basta con servir los archivos estáticos desde la raíz del proyecto.

**Con VS Code Live Server:** clic derecho en `index.html` → *Open with Live Server*

**Con Python:**
```bash
python3 -m http.server 3000
```

**Con Node.js:**
```bash
npx serve .
```

El backend debe estar corriendo y accesible en `/api/v1`. Configurar un proxy si corren en puertos distintos.

## Convenciones CSS

### Capas y dónde agregar estilos

| ¿Qué es? | Archivo |
|---|---|
| Nueva variable de color, tamaño o espaciado | `variables.css` |
| Componente reutilizable en múltiples páginas (badge, tabla, tag) | `components.css` |
| Sección o elemento exclusivo de una página | `css/pages/[página].css` |
| Override contextual de un componente en una página específica | `css/pages/[página].css` con selector padre |

### Nomenclatura BEM

```css
.block {}              /* Bloque: componente independiente */
.block__element {}     /* Elemento: parte del bloque */
.block--modifier {}    /* Modificador: variante del bloque */
.block__element--modifier {}
```

### Override contextual (sin romper el componente base)

Cuando un componente compartido necesita verse distinto en una página específica, se contextualiza con un selector padre en lugar de modificar la clase base:

```css
/* components.css — base compartida */
.search-form__input { ... }

/* pages/catalog.css — override solo en el catálogo */
.catalog-search .search-form__input { ... }
```

## Agregar una nueva página

1. Crear `templates/nueva-pagina.html` con las 4 capas CSS base y su hoja de página:
   ```html
   <link rel="stylesheet" href="../css/reset.css">
   <link rel="stylesheet" href="../css/variables.css">
   <link rel="stylesheet" href="../css/layout.css">
   <link rel="stylesheet" href="../css/components.css">
   <link rel="stylesheet" href="../css/pages/nueva-pagina.css">
   ```
2. Crear `css/pages/nueva-pagina.css`
3. Crear `js/pages/nueva-pagina.js` — primera línea: `requireAuth()` si es página protegida
4. Linkear el script al final del body:
   ```html
   <script type="module" src="../js/components/navbar.js"></script>
   <script type="module" src="../js/components/footer.js"></script>
   <script type="module" src="../js/pages/nueva-pagina.js"></script>
   ```

## Agregar un nuevo servicio

Crear `js/services/nuevoService.js` siguiendo el mismo patrón que `authService.js`:

```js
import { api } from './api.js';

const nuevoService = {
  getAll()         { return api.get('/recurso'); },
  getById(id)      { return api.get(`/recurso/${id}`); },
  create(data)     { return api.post('/recurso', data); },
  update(id, data) { return api.put(`/recurso/${id}`, data); },
  remove(id)       { return api.delete(`/recurso/${id}`); },
};

export { nuevoService };
```

## Contrato con el backend

El archivo `endpoints-backend/endpoints.yml` contiene la especificación OpenAPI de los endpoints disponibles. Endpoints utilizados actualmente por el frontend:

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Autenticar usuario, retorna JWT | No |
| `POST` | `/auth/logout` | Cerrar sesión | Bearer |
| `POST` | `/auth/register` | Registrar nuevo usuario y lector | No |
| `POST` | `/auth/change-password` | Cambiar contraseña | Bearer |
| `GET` | `/lectores/mi-perfil` | Obtener perfil del lector autenticado | Bearer |
| `GET` | `/lectores/me/prestamos` | Listar préstamos del lector autenticado | Bearer |
| `GET` | `/lectores/me/reservas` | Listar reservas del lector autenticado | Bearer |
| `GET` | `/documentos` | Listar tipos de documento | Bearer |
| `GET` | `/articulos/{id}` | Obtener detalle de un artículo | Bearer |
| `POST` | `/articulos/importar/marc21` | Importar registros MARC21/MARCXML | Bearer |
| `POST` | `/libros` | Crear un libro | Bearer |
| `GET` | `/libros` | Listar libros | Bearer |
| `GET` | `/libros/{id}` | Obtener detalle de un libro | Bearer |
| `GET` | `/ejemplares` | Listar ejemplares | Bearer |
| `GET` | `/ejemplares/{id}` | Obtener detalle de un ejemplar | Bearer |
| `POST` | `/ejemplares` | Crear ejemplar | Bearer |
| `PUT` | `/ejemplares/{id}` | Actualizar ejemplar | Bearer |
| `DELETE` | `/ejemplares/{id}` | Eliminar ejemplar | Bearer |
| `GET` | `/prestamos` | Listar préstamos con filtros | Bearer |
| `GET` | `/prestamos/{id}` | Obtener detalle de un préstamo | Bearer |
| `GET` | `/prestamos/ejemplar/{ejemplar_id}` | Obtener préstamo por ejemplar | Bearer |
| `POST` | `/prestamos` | Crear préstamo | Bearer |
| `GET` | `/tipos-prestamos` | Listar tipos de préstamos | Bearer |
| `PATCH` | `/prestamos/{id}/renovar` | Renovar préstamo | Bearer |
| `PATCH` | `/prestamos/{id}/devolver` | Marcar préstamo como devuelto | Bearer |
| `POST` | `/prestamos/{id}/vencer` | Marcar préstamo como vencido | Bearer |
| `GET` | `/reservas` | Listar reservas con filtros | Bearer |
| `GET` | `/reservas/{id}` | Obtener detalle de una reserva | Bearer |
| `POST` | `/reservas` | Crear reserva | Bearer |
| `POST` | `/reservas/{id}/aprobar` | Aprobar reserva | Bearer |
| `POST` | `/reservas/{id}/cancelar` | Cancelar reserva | Bearer |
| `PATCH` | `/reservas/{id}/cancelar` | Cancelar reserva desde el lector | Bearer |
| `POST` | `/reservas/{id}/vencer` | Marcar reserva como vencida | Bearer |

El token JWT se incluye automáticamente en todos los requests mediante `api.js`. Un `401` con token activo limpia la sesión y redirige al inicio.
