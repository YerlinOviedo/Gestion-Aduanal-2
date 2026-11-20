# Matriz de perfiles y permisos

Proyecto 02 · Frontend React para la API de Trámites Aduanales

Los tres perfiles del Proyecto 1 se mantienen. Los define `cuentas/permisos.py` del backend:

| Método HTTP | Administrador | Operador | Consulta |
|---|---|---|---|
| GET (consultar) | Sí | Sí | Sí |
| POST / PUT / PATCH (crear, editar, acciones) | Sí | Sí | No (403) |
| DELETE (eliminar) | Sí | No (403) | No (403) |
| Anular cobro | Sí | No (403) | No (403) |
| Administrar usuarios | Sí | No (403) | No (403) |
| Sin token o con token revocado | 401 | 401 | 401 |

## 1. Diferencias en la interfaz

Las acciones se adaptan al rol que devuelve el login (`AuthContext`: `puedeEscribir` y `esAdmin`). **Esto es solo comodidad para el usuario:** Django vuelve a validar el rol en cada solicitud y responde 403 si no tiene permiso.

| Pantalla / acción | Administrador | Operador | Consulta |
|---|---|---|---|
| Dashboard y listados de los 5 módulos | Ve todo | Ve todo | Ve todo |
| Búsqueda, filtros, orden y paginación | Sí | Sí | Sí |
| Formularios de registro y botón **Editar** | Visibles | Visibles | Ocultos; aparece el aviso "Su rol solo permite consultar" |
| Botón **Eliminar** (clientes, transportistas, cargas, trámites, cobros) | Visible | Oculto | Oculto |
| Detalle de trámite | Ve detalle y botones de estado | Ve detalle y botones de estado | Solo ve el detalle |
| Resolver permisos de un trámite | Sí | Sí | No |
| Registrar pago de un cobro | Sí | Sí | No |
| **Anular** cobro | Visible | Oculto | Oculto |
| Menú **Usuarios** | CRUD completo | Muestra "Acceso denegado (403)" que responde Django | Muestra "Acceso denegado (403)" que responde Django |
| Etiqueta del rol en la barra superior | Administrador | Operador | Consulta |

## 2. Diferencias desde la API

Se pueden comprobar con Postman, con la colección del Proyecto 1, o con estas solicitudes:

| Solicitud | Administrador | Operador | Consulta |
|---|---|---|---|
| `GET /api/clientes/` | 200 | 200 | 200 |
| `POST /api/clientes/` | 201 | 201 | **403** |
| `DELETE /api/clientes/{id}/` (sin cargas) | 204 | **403** | **403** |
| `POST /api/cobros/{id}/anular/` | 200 | **403** | **403** |
| `GET /api/auth/usuarios/` | 200 | **403** | **403** |
| `GET /api/clientes/` sin encabezado `Authorization` | **401** | **401** | **401** |
| `GET /api/clientes/` con un token ya cerrado con logout | **401** | **401** | **401** |

## 3. Cómo maneja la interfaz el 401 y el 403

- **401:** el interceptor de `src/api/client.js` borra la sesión del navegador y envía a `/login?sesion=expirada`, que muestra "Su sesión expiró o el token fue revocado (401)".
- **403:** `getError()` muestra el mensaje de Django con el código, por ejemplo "Su rol no tiene permiso para realizar esta operación. (403)". En `/usuarios` se muestra una pantalla de acceso denegado.
