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
│   ├── dashboard.html           # Panel del usuario autenticado
│   ├── catalog.html             # Catálogo de libros
│   ├── book-detail.html         # Detalle de un libro
│   ├── loans.html               # Gestión de préstamos
│   └── readers.html             # Gestión de lectores
│
├── css/
│   ├── reset.css                # Normalización de defaults del browser
│   ├── variables.css            # Design tokens: colores, tipografía, espaciado
│   ├── layout.css               # Navbar, footer, container — compartido en todas las páginas
│   ├── components.css           # Piezas reutilizables: botones, cards, inputs, search form
│   └── pages/
│       ├── home.css             # Estilos exclusivos de index.html (hero, login form, partners)
│       ├── dashboard.css        # Estilos exclusivos de dashboard.html
│       └── catalog.css          # Estilos exclusivos de catalog.html
│
├── js/
│   ├── core/
│   │   ├── store.js             # Estado global de sesión (token JWT + usuario)
│   │   └── authGuard.js         # Protección de rutas: requireAuth(), requireGuest()
│   ├── services/
│   │   ├── api.js               # HTTP client — único lugar donde vive fetch()
│   │   ├── authService.js       # Endpoints de autenticación: login, logout, register
│   │   └── lectoresService.js   # Endpoint del perfil autenticado del lector
│   ├── components/
│   │   ├── navbar.js            # Comportamiento del navbar (hamburguesa, dropdown)
│   │   ├── footer.js            # Comportamiento del footer
│   │   ├── modal.js             # Modal reutilizable (confirm, alert)
│   │   └── ui.js                # Estados visuales: showLoading, showError, showEmpty
│   └── pages/
│       ├── home.js              # Lógica de index.html (login, búsqueda, accesibilidad)
│       ├── dashboard.js         # Lógica de dashboard.html (guard, préstamos, logout)
│       └── catalog.js           # Lógica de catalog.html
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

En dashboard.html:
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

El archivo `endpoints-backend/endpoints.yml` contiene la especificación OpenAPI de los endpoints disponibles. Endpoints implementados actualmente:

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Autenticar usuario, retorna JWT | No |
| `POST` | `/auth/logout` | Cerrar sesión | Bearer |
| `POST` | `/auth/register` | Registrar nuevo usuario y lector | No |
| `POST` | `/auth/change-password` | Cambiar contraseña | Bearer |
| `GET` | `/lectores/mi-perfil` | Obtener perfil del lector autenticado | Bearer |

El token JWT se incluye automáticamente en todos los requests mediante `api.js`. Un `401` con token activo limpia la sesión y redirige al inicio.
