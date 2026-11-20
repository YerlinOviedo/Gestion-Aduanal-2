# Matriz de pantallas y endpoints

Proyecto 02 · Frontend React para la API de Trámites Aduanales

Todas las rutas son relativas a la URL base `VITE_API_URL` (por defecto `http://127.0.0.1:8000/api`). Todas, salvo el login, exigen el encabezado `Authorization: Token <token>`. La columna **Servicio** indica la función de `frontend/src/services/` que hace la llamada.

## 1. Acciones de la interfaz

### Login y sesión (`/login`, barra superior)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Ingresar | POST | `/auth/login/` | `AuthContext.login` | 200 token/usuario/rol · 400 credenciales incorrectas |
| Salir | POST | `/auth/logout/` | `AuthContext.logout` | 204 token revocado · 401 (igual se limpia la sesión) |

### Dashboard (`/dashboard`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Uso |
|---|---|---|---|---|
| Tarjeta "Clientes registrados" | GET | `/clientes/?page=1` | `listarClientes` | `total_registros` |
| Tarjeta "Trámites activos" y lista por estado | GET | `/reportes/tramites-por-estado/` | `tramitesPorEstado` | Suma de REGISTRADO, EN_REVISION y APROBADO |
| Tarjeta "Ingresos del mes" | GET | `/reportes/ingresos/` | `ingresosDelMes` | `total` de cobros pagados en el mes |
| Tarjeta "Listos para liberar" | GET | `/reportes/listos-para-liberar/` | `listosParaLiberar` | `cantidad` |
| Tarjeta "Saldo pendiente" y tabla de clientes | GET | `/reportes/resumen-clientes/?solo_con_saldo=true` | `clientesConSaldo` | Suma de `saldo_pendiente` |
| Tarjeta "Licencias por vencer" | GET | `/reportes/licencias-por-vencer/?dias=30` | `licenciasPorVencer` | Cantidad de transportistas |

### Clientes (`/clientes`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar, buscar, filtrar y paginar | GET | `/clientes/?buscar=&activo=&page=` | `listarClientes` | 200 · 400 filtro inválido |
| Registrar | POST | `/clientes/` | `crearCliente` | 201 · 400 por campo (cédula, correo, teléfono) |
| Editar (precarga los datos de la fila) | PUT | `/clientes/{id}/` | `actualizarCliente` | 200 · 400 (p. ej. desactivar con trámites activos) · 404 |
| Eliminar (con confirmación) | DELETE | `/clientes/{id}/` | `eliminarCliente` | 204 · 403 · 409 tiene cargas |
| Llenar selectores en Cargas y Trámites | GET | `/clientes/?page=1..n` | `listarTodosClientes` | 200 |

### Transportistas (`/transportistas`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar, filtrar (estado + licencia) y paginar | GET | `/transportistas/?activo=&licencia_vigente=&page=` | `listarTransportistas` | 200 · 400 |
| Registrar | POST | `/transportistas/` | `crearTransportista` | 201 · 400 por campo (cédula, teléfono, placa) |
| Editar | PUT | `/transportistas/{id}/` | `actualizarTransportista` | 200 · 400 · 404 |
| Eliminar (con confirmación) | DELETE | `/transportistas/{id}/` | `eliminarTransportista` | 204 · 403 · 409 tiene trámites |
| Llenar selector en Trámites | GET | `/transportistas/?page=1..n` | `listarTodosTransportistas` | 200 |

### Cargas (`/cargas`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar, buscar, filtrar, ordenar y paginar | GET | `/cargas/?buscar=&cliente=&tipo=&ordenar=&page=` | `listarCargas` | 200 · 400 orden inválido |
| Registrar (selector de cliente) | POST | `/cargas/` | `crearCarga` | 201 · 400 (contenedor, peso, fecha futura, cliente inactivo) |
| Editar | PUT | `/cargas/{id}/` | `actualizarCarga` | 200 · 400 (cambiar cliente con trámites) · 404 |
| Eliminar (con confirmación) | DELETE | `/cargas/{id}/` | `eliminarCarga` | 204 · 403 · 409 tiene trámites |
| Llenar selector en Trámites | GET | `/cargas/?page=1..n` | `listarTodosCargas` | 200 |

### Trámites (`/tramites`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar, buscar, filtrar y paginar | GET | `/tramites/?buscar=&estado=&tipo=&cliente=&page=` | `listarTramites` | 200 · 400 |
| Ver detalle (carga, cliente, transportista, permisos y cobros) | GET | `/tramites/{id}/` | `obtenerTramite` | 200 · 404 |
| Registrar (selectores de carga y transportista) | POST | `/tramites/` | `crearTramite` | 201 con permisos asignados · 400 transportista inactivo/licencia vencida · 409 carga con trámite activo |
| Editar | PUT | `/tramites/{id}/` | `actualizarTramite` | 200 · 400 · 409 trámite cerrado |
| Eliminar (solo REGISTRADO, con confirmación) | DELETE | `/tramites/{id}/` | `eliminarTramite` | 204 · 403 · 409 |
| Enviar a revisión / Aprobar / Liberar / Cancelar | POST | `/tramites/{id}/cambiar-estado/` | `cambiarEstadoTramite` | 200 · 400 (faltan permisos, cobros pendientes, sin transportista) · 409 trámite cerrado |
| Aprobar o rechazar un permiso | POST | `/tramites/{id}/resolver-permiso/` | `resolverPermiso` | 200 · 400 (falta resolución o no está EN_REVISION) · 404 |
| Llenar selector en Cobros | GET | `/tramites/?page=1..n` | `listarTodosTramites` | 200 |

### Cobros (`/cobros`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar, filtrar, ordenar y paginar | GET | `/cobros/?estado=&concepto=&ordenar=&page=` | `listarCobros` | 200 · 400 |
| Registrar (selector de trámite abierto) | POST | `/cobros/` | `crearCobro` | 201 con número de factura · 400 trámite cerrado o monto ≤ 0 · 409 concepto repetido |
| Editar (solo PENDIENTE) | PUT | `/cobros/{id}/` | `actualizarCobro` | 200 · 400 · 409 cobro pagado/anulado |
| Registrar pago | POST | `/cobros/{id}/registrar-pago/` | `registrarPago` | 200 · 400 método inválido · 409 ya pagado/anulado |
| Anular | POST | `/cobros/{id}/anular/` | `anularCobro` | 200 · 403 · 409 |
| Eliminar (solo PENDIENTE, con confirmación) | DELETE | `/cobros/{id}/` | `eliminarCobro` | 204 · 403 · 409 |

### Usuarios (`/usuarios`)

| Acción en la interfaz | Método | Ruta REST | Servicio | Respuestas que maneja la interfaz |
|---|---|---|---|---|
| Listar | GET | `/auth/usuarios/` | `listarUsuarios` | 200 · **403 "Acceso denegado"** con Operador y Consulta |
| Registrar con rol | POST | `/auth/usuarios/` | `crearUsuario` | 201 · 400 (contraseña débil, usuario repetido) |
| Editar (contraseña opcional) | PATCH | `/auth/usuarios/{id}/` | `actualizarUsuario` | 200 · 400 · 404 |
| Eliminar (con confirmación) | DELETE | `/auth/usuarios/{id}/` | `eliminarUsuario` | 204 · 404 |

## 2. Inventario de endpoints usados

| Ruta | Métodos | Permisos (Django) | Parámetros | Respuesta |
|---|---|---|---|---|
| `/auth/login/` | POST | Público | `username`, `password` | `{token, usuario, rol}` |
| `/auth/logout/` | POST | Autenticado | — | 204 |
| `/auth/usuarios/`, `/auth/usuarios/{id}/` | GET, POST, PATCH, DELETE | Administrador | — | Lista o usuario `{id, username, ..., rol, is_active}` |
| `/clientes/`, `/clientes/{id}/` | GET, POST, PUT, DELETE | GET todos · POST/PUT Admin y Operador · DELETE Admin | `activo`, `buscar`, `page` | Paginada `{pagina_actual, total_paginas, total_registros, resultados}` |
| `/transportistas/`, `/transportistas/{id}/` | GET, POST, PUT, DELETE | Igual que clientes | `activo`, `licencia_vigente`, `page` | Paginada |
| `/cargas/`, `/cargas/{id}/` | GET, POST, PUT, DELETE | Igual que clientes | `cliente`, `tipo`, `buscar`, `ordenar`, `page` | Paginada |
| `/tramites/`, `/tramites/{id}/` | GET, POST, PUT, DELETE | Igual que clientes | `estado`, `tipo`, `cliente`, `buscar`, `page` | Paginada; el detalle incluye `permisos` y `resumen_cobros` |
| `/tramites/{id}/cambiar-estado/` | POST | Admin y Operador | `estado` | Trámite actualizado |
| `/tramites/{id}/resolver-permiso/` | POST | Admin y Operador | `permiso`, `estado`, `numero_resolucion` | Permiso actualizado |
| `/cobros/`, `/cobros/{id}/` | GET, POST, PUT, DELETE | Igual que clientes | `estado`, `concepto`, `ordenar`, `page` | Paginada |
| `/cobros/{id}/registrar-pago/` | POST | Admin y Operador | `metodo_pago` | Cobro pagado |
| `/cobros/{id}/anular/` | POST | Administrador | — | Cobro anulado |
| `/reportes/*` (5 usados) | GET | Todos los roles | Ver dashboard | JSON del reporte |

Los 5 recursos paginados devuelven 5 registros por página. Los errores siguen este formato: `{"detail": ...}` para 401/403, `{"error": ...}` para 404/409 y `{"campo": ["mensaje"]}` para 400.

## 3. Flujos entre módulos

1. **Cliente → Carga:** el formulario de cargas tiene un selector con los clientes de la API; los inactivos aparecen deshabilitados.
2. **Carga + Transportista → Trámite:** el formulario de trámites tiene selectores de carga y transportista; los transportistas inactivos o con licencia vencida aparecen deshabilitados.
3. **Trámite → Permisos:** al crear un trámite, Django asigna los permisos según el tipo de carga y la interfaz abre el detalle para mostrarlos.
4. **Trámite → Cobros:** el formulario de cobros solo ofrece trámites abiertos. El detalle del trámite muestra el total, lo pagado y lo pendiente.
5. **Cambio de estado que afecta otras entidades:** al cancelar un trámite, Django anula sus cobros pendientes. Liberar exige permisos aprobados, transportista habilitado y cobros pagados. Después de cada cambio, la interfaz vuelve a consultar el detalle y el listado.

## 4. Ampliación del backend

| Cambio | Archivo | Justificación |
|---|---|---|
| Se agregó `django-cors-headers` | `backend/requirements.txt` | Sin CORS el navegador bloquea las llamadas de React (puerto 5173) a Django (puerto 8000) |
| `corsheaders` en `INSTALLED_APPS`, `CorsMiddleware` y `CORS_ALLOWED_ORIGINS` | `backend/config_backend/settings.py` | Solo se permiten las direcciones del frontend definidas en el `.env` |
| Variable `CORS_ALLOWED_ORIGINS` | `backend/.env.example` | Configurable sin tocar el código |

No se crearon ni modificaron endpoints: los existentes del Proyecto 1 cubren todas las pantallas. Las reglas de negocio, validaciones y permisos no cambiaron; las 62 pruebas automáticas del backend siguen pasando.
