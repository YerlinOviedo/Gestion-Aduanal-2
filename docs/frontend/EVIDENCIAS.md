# Evidencias de pruebas manuales

Proyecto 02 · Frontend React para la API de Trámites Aduanales

**Ambiente:** backend Django (`python manage.py runserver`) con los datos de `python manage.py cargar_datos`, y frontend con `npm run dev` en `http://localhost:5173`. La contraseña de los usuarios de prueba es el valor de `DEMO_PASSWORD`.

Para repetir cada escenario desde cero, se vuelve a ejecutar `python manage.py cargar_datos` (no duplica datos).

## 1. Escenarios

| # | Escenario | Usuario | Pasos | Resultado esperado | Obtenido | Captura |
|---|---|---|---|---|---|---|
| E01 | Login exitoso | admin_demo | Abrir `/login`, escribir usuario y contraseña, Ingresar | Entra al dashboard; la barra superior muestra el usuario y el rol | Cumple | [03](capturas/03_dashboard.png) |
| E02 | Login con contraseña incorrecta | admin_demo | Escribir una contraseña errónea, Ingresar | Se queda en el login con "Usuario o contraseña incorrectos." (400 de Django) | Cumple | [02](capturas/02_login_error.png) |
| E03 | Ruta protegida sin sesión | — | Sin iniciar sesión, abrir `http://localhost:5173/cobros` | Redirige a `/login` | Cumple | [01](capturas/01_login.png) |
| E04 | Navegación SPA | admin_demo | Usar el menú lateral: Dashboard → Clientes → Transportistas → Cargas → Trámites → Cobros | Cambia el área principal sin recargar la página (la red no vuelve a pedir `index.html`) | Cumple | [04](capturas/04_clientes.png) |
| E05 | Dashboard con datos reales | admin_demo | Abrir `/dashboard` | 6 indicadores, trámites por estado y clientes con saldo, leídos de la API | Cumple | [03](capturas/03_dashboard.png) |
| E06 | Validación de formulario (400) | admin_demo | Clientes → registrar con un correo que ya existe (`info@frutasesparza.test`) | El campo correo se marca en rojo con "Ya existe cliente con este correo." | Cumple | [05](capturas/05_error_validacion_400.png) |
| E07 | CRUD: crear y editar | admin_demo | Registrar un cliente con datos válidos; luego presionar Editar en un cliente de la tabla y guardar un cambio | Aviso de éxito; aparece en el listado; al editar, el formulario se precarga ("Editar cliente #5") y los cambios se guardan | Cumple | [06](capturas/06_formulario_edicion.png) |
| E08 | Eliminar con conflicto (409) | admin_demo | Clientes → Eliminar "Frutas Tropicales de Esparza" → Aceptar | Pide confirmación y muestra "No se puede eliminar un cliente que tiene cargas registradas. (409)" | Cumple | [07](capturas/07_error_conflicto_409.png) |
| E09 | Filtros combinados | admin_demo | Transportistas → Estado "Activos" + Licencia "Licencia vencida" | Solo aparecen los que cumplen ambos filtros (filtrado en Django: `?activo=true&licencia_vigente=false`) | Cumple | [08](capturas/08_transportistas_filtros.png) |
| E10 | Ordenamiento y paginación | admin_demo | Cargas → Ordenar "Peso: menor a mayor" → Siguiente | Ordenado por peso de menor a mayor; muestra "Página 1 de 2" y pasa a la página 2 (`?ordenar=peso_kg&page=2`) | Cumple | [09](capturas/09_cargas_orden_paginacion.png) |
| E11 | Búsqueda | admin_demo | Clientes → buscar "Frutas" | Solo aparecen coincidencias (`?buscar=Frutas`) | Cumple | — |
| E12 | Relación entre módulos y regla de negocio | admin_demo / operador_demo | Trámites → Ver un trámite EN_REVISION → Aprobar sin resolver permisos; luego aprobar cada permiso con su número de resolución y Aprobar | Primero: "Faltan permisos por aprobar: …" (400). Después pasa a APROBADO | Cumple | [10](capturas/10_tramites_detalle.png) |
| E13 | Registrar pago | admin_demo | Cobros → Pagar → elegir método → Confirmar pago | El cobro pasa a PAGADO con método y fecha; el saldo del dashboard baja | Cumple | [11](capturas/11_cobros_pago.png) |
| E14 | Acciones según perfil | operador_demo / consulta_demo | Operador: abrir Clientes. Consulta: abrir Cargas | Operador ve el formulario y Editar, pero no Eliminar. Consulta no ve el formulario y aparece "Su rol solo permite consultar" | Cumple | [13](capturas/13_operador_sin_eliminar.png), [15](capturas/15_consulta_solo_lectura.png) |
| E15 | Acceso denegado (403) | operador_demo | Menú Seguridad → Usuarios | La interfaz consulta `GET /api/auth/usuarios/` y muestra "Acceso denegado … (403)" que respondió Django | Cumple | [14](capturas/14_acceso_denegado_403.png) |
| E16 | Token revocado (401) | consulta_demo | Con la sesión abierta, reemplazar el token por uno inválido (F12 → Consola → `sessionStorage.setItem('aduana_token','x')`) o borrarlo desde el admin de Django, y navegar a Cobros | La sesión local se limpia y redirige a `/login` con el aviso "Su sesión expiró o el token fue revocado (401)" | Cumple | [16](capturas/16_sesion_expirada_401.png) |
| E17 | Logout | cualquiera | Salir | `POST /api/auth/logout/` responde 204, se limpia el `sessionStorage` y se vuelve al login. El token anterior ya no sirve (Postman con ese token → 401 "Token inválido.") | Cumple | — |
| E18 | Diseño adaptable | operador_demo | Abrir en un celular o con el modo responsivo del navegador (390 px de ancho) | El menú lateral se cambia por botones arriba; las tablas se desplazan de lado; los formularios quedan en una columna | Cumple | [17](capturas/17_movil_dashboard.png) |
| E19 | Administración de usuarios | admin_demo | Usuarios → registrar `nuevo_operador` con contraseña "123"; luego con una válida; cambiar el rol a Consulta; eliminar | Primero se muestran los errores de contraseña de Django (400); luego se crea, se actualiza el rol y se elimina | Cumple | [12](capturas/12_usuarios_admin.png) |
| E20 | Fallo de red | admin_demo | Detener `runserver` y presionar Actualizar en cualquier listado | Mensaje "No se puede conectar con Django. Compruebe que el servidor esté encendido." | Cumple | — |

## 2. Capturas

| Archivo | Muestra |
|---|---|
| `01_login.png` | Pantalla de login |
| `02_login_error.png` | Credenciales incorrectas |
| `03_dashboard.png` | Dashboard con indicadores de la API |
| `04_clientes.png` | Módulo de clientes |
| `05_error_validacion_400.png` | Error de validación por campo |
| `06_formulario_edicion.png` | Formulario de edición precargado |
| `07_error_conflicto_409.png` | Eliminación rechazada por Django (409) |
| `08_transportistas_filtros.png` | Módulo de transportistas con filtros combinados |
| `09_cargas_orden_paginacion.png` | Módulo de cargas con orden y paginación |
| `10_tramites_detalle.png` | Módulo de trámites con detalle, permisos y cobros |
| `11_cobros_pago.png` | Módulo de cobros registrando un pago |
| `12_usuarios_admin.png` | Administración de usuarios (Administrador) |
| `13_operador_sin_eliminar.png` | Perfil Operador: sin botón Eliminar |
| `14_acceso_denegado_403.png` | Perfil Operador en Usuarios: 403 |
| `15_consulta_solo_lectura.png` | Perfil Consulta: solo lectura |
| `16_sesion_expirada_401.png` | Aviso de sesión expirada (401) |
| `17_movil_dashboard.png` | Vista en celular |

Las capturas complementan la demostración en vivo, pero no la sustituyen.
