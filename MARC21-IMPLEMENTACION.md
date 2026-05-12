# Implementación MARC21 — Guía de integración

## Estado actual

El frontend ya tiene la UI de importación completa en `templates/panel-staff/carga-articulos.html` (pestaña "Importar MARC21").

El archivo se envía al backend via `POST /articulos/importar/marc21` (`multipart/form-data`).
**El endpoint aún no existe en el backend** — esta guía describe lo que se necesita implementar en ambos lados para que funcione.

---

## Formatos soportados

| Formato | Extensión | Descripción |
|---|---|---|
| ISO 2709 | `.mrc`, `.marc` | Formato binario clásico. Encoding UTF-8 (leader byte 9 = `a`) o MARC-8 (legacy). |
| MARCXML | `.xml` | MARC21 codificado en XML. Esquema oficial del Library of Congress. |

> El frontend valida la extensión antes de enviar. El backend debe validar también el contenido real del archivo.

---

## Contrato del endpoint

### Request

```
POST /articulos/importar/marc21
Content-Type: multipart/form-data
Authorization: Bearer <token>

archivo: <File>   → archivo .mrc, .marc o .xml
```

### Response 201

```json
{
  "importados": 5,
  "total": 7,
  "registros": [
    { "id": 142, "titulo": "Algorithms", "tipo": "libro" },
    { "id": 143, "titulo": "Clean Code", "tipo": "libro" }
  ],
  "errores": [
    { "indice": 2, "titulo": null,        "mensaje": "Campo título (245) vacío" },
    { "indice": 5, "titulo": "Clean Code", "mensaje": "ISBN duplicado: 9780321573513" }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `importados` | `int` | Registros persistidos exitosamente |
| `total` | `int` | Total de registros encontrados en el archivo |
| `registros[]` | `array` | Detalle de cada registro importado |
| `registros[].id` | `int` | ID del artículo creado en la DB |
| `registros[].titulo` | `string` | Título extraído del campo 245 |
| `registros[].tipo` | `string` | Tipo de artículo creado (`libro`, `revista`, etc.) |
| `errores[]` | `array` | Registros que fallaron (puede ser vacío) |
| `errores[].indice` | `int` | Posición del registro en el archivo (base 0) |
| `errores[].titulo` | `string\|null` | Título si se pudo extraer, null si no |
| `errores[].mensaje` | `string` | Motivo del error |

### Respuestas de error

| Status | Cuándo |
|---|---|
| `400` | Archivo con formato inválido o extensión no soportada |
| `422` | El archivo es válido pero ningún registro pudo importarse |
| `500` | Error interno del servidor |

---

## Determinación del tipo de artículo

El tipo de artículo a crear se deriva del **leader del registro MARC**, específicamente del byte 6 (tipo de registro) y byte 7 (nivel bibliográfico):

| Leader[6] | Leader[7] | Tipo sugerido |
|---|---|---|
| `a` | `a`, `c`, `d`, `m` | `libro` |
| `a` | `b`, `i`, `s` | `revista` |
| `g` | cualquiera | audiovisual |
| `j` | cualquiera | material musical |
| `e`, `f` | cualquiera | mapa |
| `k` | cualquiera | imagen |
| `m` | cualquiera | recurso digital |
| `r` | cualquiera | objeto tridimensional |

Esto se alinea directamente con la herencia `Articulo` → `Libro`, `Revista`, etc. del backend. El backend determina qué subclase instanciar según esta lógica.

---

## Mapeo de campos MARC21 → modelo de datos

### Artículo (base)

| Campo MARC | Subcampo | Campo en DB | Notas |
|---|---|---|---|
| `245` | `$a`, `$b` | `titulo` | Concatenar $a y $b, limpiar puntuación final |
| `008` | pos. 7-10 | `anio_publicacion` | Año de 4 dígitos |
| `008` | pos. 35-37 | `idioma` | Código ISO 639-2 (ej: `spa`, `eng`) |
| `520` | `$a` | `descripcion` | Resumen/abstract |
| — | — | `tipo_documento_id` | Determinar por leader (ver tabla arriba) |

### Libro

| Campo MARC | Subcampo | Campo en DB | Notas |
|---|---|---|---|
| `020` | `$a` | `isbn` | Limpiar guiones, tomar solo dígitos y X |
| `022` | `$a` | `issn` | Formato XXXX-XXXX |
| `300` | `$a` | `paginas` | Extraer número con regex |
| `300` | `$c` | `dimensiones` | Ej: "24 cm" |
| `300` | `$b` | `ilustraciones` | Ej: "il., mapas" |
| `260`/`264` | `$b` | `editorial` | Preferir 264, limpiar puntuación |
| `260`/`264` | `$a` | `lugar_de_publicacion` | Limpiar puntuación |
| `260`/`264` | `$a` | `pais_publicacion` | Último token separado por coma |
| `250` | `$a` | `edicion` | Ej: "4ta edición" |
| `490`/`440` | `$a` | `serie` | |
| `490`/`440` | `$v` | `numero_serie` | Número de volumen |
| `500` | `$a` | `notas` | Concatenar todos los 500 |
| `082`/`083` | `$a` | `cdu` | Clasificación Decimal Universal |
| `246` | `$a` | `titulo_informativo` | Título variante/informativo |

### Personas (autores y colaboradores)

| Campo MARC | Rol por defecto | Notas |
|---|---|---|
| `100` | `autor` | Entrada principal de nombre personal. Formato: "Apellido, Nombre" |
| `700` | `autor` | Entradas adicionales. Rol específico en `$e` |
| `110`/`710` | `editor` | Entradas de nombre corporativo |

Subcampos relevantes por persona:
- `$a` — Nombre (formato invertido: "Apellido, Nombre,")
- `$e` — Término de relación / rol (ej: "author.", "editor.", "illustrator.")
- `$4` — Código de relación URI (alternativa moderna a `$e`)

Roles MARC comunes y su equivalente en el sistema:

| Valor en `$e` | Rol en DB |
|---|---|
| `author`, `aut` | `autor` |
| `editor`, `ed.` | `editor` |
| `illustrator`, `ill.` | `ilustrador` |
| `translator`, `trl.` | `traductor` |
| `compiler`, `com.` | `compilador` |
| `director`, `drt.` | `director` |

### Temas (relación con tabla `temas`)

| Campo MARC | Subcampo | Uso |
|---|---|---|
| `650` | `$a` | Tema general |
| `651` | `$a` | Tema geográfico |
| `600` | `$a` | Tema — nombre personal |

Estrategia sugerida: buscar cada tema en la tabla `temas` por nombre (case-insensitive). Si no existe, crearlo. Luego asociarlo al artículo via la tabla intermedia.

---

## Consideraciones de encoding

| Encoding | Identificador | Cómo detectarlo |
|---|---|---|
| UTF-8 | Leader byte 9 = `'a'` | Leer el leader antes de procesar |
| MARC-8 | Leader byte 9 = `' '` (espacio) | Requiere tabla de conversión MARC-8 → Unicode |
| MARCXML | Declaración XML | Siempre UTF-8 según la especificación |

Para MARC-8 se recomienda usar una librería existente. En Python: `pymarc` maneja la conversión automáticamente. En Java: `marc4j`.

---

## Librerías recomendadas por lenguaje

| Lenguaje | Librería | Notas |
|---|---|---|
| Python | [`pymarc`](https://pymarc.readthedocs.io/) | Soporta ISO 2709 y MARCXML, maneja MARC-8 |
| Java | [`marc4j`](https://github.com/marc4j/marc4j) | Soporta ambos formatos |
| PHP | [`File_MARC`](https://pear.php.net/package/File_MARC) | |
| Ruby | [`ruby-marc`](https://github.com/ruby-marc/ruby-marc) | |

---

## Cambios necesarios en el frontend cuando el endpoint esté disponible

El frontend **ya está implementado** y listo para conectarse. No requiere cambios de lógica.

Lo único que puede necesitar ajuste es el contrato de la respuesta. Si el backend devuelve una estructura diferente a la documentada arriba, actualizar:

- `js/services/articulosService.js` → JSDoc del método `importarMarc21()`
- `js/pages/carga-articulos.js` → función `renderImportResults(result)` que destructura `{ importados, total, registros, errores }`

---

## Archivos relevantes del frontend

```
js/services/articulosService.js   → método importarMarc21(archivo)
js/pages/carga-articulos.js       → lógica drag&drop, envío y render de resultados
templates/panel-staff/
  carga-articulos.html            → panel MARC21 con drop zone y sección de resultados
css/pages/carga-articulos.css     → estilos del panel MARC21
```
