# Frontend React · Trámites Aduanales

Proyecto 02 · Desarrollo de Software IV · Universidad de Costa Rica, Sede del Pacífico

Aplicación web de tipo **SPA** hecha con **React + Vite + Bootstrap 5** que consume la **API REST de Django** del Proyecto 1 (carpeta `backend/` de este repositorio). No usa datos estáticos ni servicios simulados: todo se lee y se guarda en MySQL por medio de la API.

| Integrante | Carné | Responsabilidades en el frontend |
|---|---|---|
| José David Jiménez Araya | C5G177 | Login y sesión, rutas protegidas y menú, dashboard, clientes, cobros, diseño adaptable, README y evidencias |
| Yerlin Oviedo Castro | C5I097 | Base del proyecto, CORS, cliente HTTP, transportistas, cargas, trámites, seguridad (401/403, usuarios) y matrices |

Cada pull request fue revisado por la otra persona antes de unirse a `main`.

---

## 1. Requisitos

- Node.js 20 o superior (probado con Node 22) y npm.
- El backend del Proyecto 1 funcionando: Python 3.11+, MySQL 8 y sus dependencias (ver el [README del backend](../backend/README.md)).

## 2. Tecnologías

| Uso | Herramienta |
|---|---|
| Interfaz | React 19 con componentes funcionales y hooks (`useState`, `useEffect`, `useCallback`, `useContext`) |
| Proyecto | Vite |
| Rutas | React Router 7 (`BrowserRouter`, `Routes`, rutas anidadas con `Outlet`) |
| Estilos | Bootstrap 5 y Bootstrap Icons |
| HTTP | Axios con URL base configurable e interceptores |

## 3. Instalación y ejecución

### 3.1 Backend (Django)

Desde la carpeta `backend/`, con el entorno virtual activo:

```bash
pip install -r requirements.txt     # incluye django-cors-headers
python manage.py migrate
python manage.py cargar_datos       # usuarios y datos de prueba
python manage.py runserver
```

La API queda en `http://127.0.0.1:8000/api/`.

### 3.2 Frontend (React)

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm install
# Windows
copy .env.example .env
# Linux / macOS
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`.

Para generar la versión de producción: `npm run build` (crea la carpeta `dist/`, que no se sube a GitHub).

### 3.3 Variables de entorno

`frontend/.env` (copia de `.env.example`, sin secretos):

| Variable | Ejemplo | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | URL base de la API. Solo se usa en `src/api/client.js` |

## 4. Configuración CORS

El navegador bloquea las solicitudes de `localhost:5173` (React) a `127.0.0.1:8000` (Django) si el backend no las permite. Por eso se amplió el backend con **django-cors-headers**:

- `backend/requirements.txt`: se agregó `django-cors-headers`.
- `backend/config_backend/settings.py`: `corsheaders` en `INSTALLED_APPS`, `CorsMiddleware` al inicio de `MIDDLEWARE` y `CORS_ALLOWED_ORIGINS`.
- `.env` del backend: variable `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173,http://127.0.0.1:5173`).

Este es el único cambio al backend. No modifica reglas de negocio, permisos ni endpoints.

## 5. Usuarios de prueba (ficticios)

Los crea `python manage.py cargar_datos`. La contraseña de los tres es el valor de `DEMO_PASSWORD` del `.env` del backend.

| Usuario | Rol | Qué puede hacer en la interfaz |
|---|---|---|
| `admin_demo` | Administrador | Todo: consultar, crear, editar, eliminar, anular cobros y administrar usuarios |
| `operador_demo` | Operador | Consultar, crear y editar; cambiar estados, resolver permisos y registrar pagos. No elimina |
| `consulta_demo` | Consulta | Solo consultar listados y detalles |

La matriz completa está en [`docs/frontend/MATRIZ_PERFILES_PERMISOS.md`](../docs/frontend/MATRIZ_PERFILES_PERMISOS.md).

## 6. Pantallas

| Ruta | Pantalla | Funciones |
|---|---|---|
| `/login` | Inicio de sesión | Obtiene el token real de Django |
| `/dashboard` | Dashboard | 6 indicadores de la API, trámites por estado, clientes con saldo y accesos a los módulos |
| `/clientes` | Clientes | CRUD, búsqueda, filtro por estado, paginación |
| `/transportistas` | Transportistas | CRUD, filtros combinables (estado + licencia), paginación |
| `/cargas` | Cargas | CRUD, búsqueda, filtros (cliente + tipo), ordenamiento, paginación, selector de cliente |
| `/tramites` | Trámites | CRUD, búsqueda, filtros (estado + tipo + cliente), detalle con permisos y cobros, cambio de estado y resolución de permisos |
| `/cobros` | Cobros | CRUD, filtros (estado + concepto), ordenamiento, registrar pago y anular |
| `/usuarios` | Usuarios | CRUD de usuarios y roles (solo Administrador; los demás ven el 403) |

Cada acción con su método y ruta REST está en [`docs/frontend/MATRIZ_PANTALLAS_ENDPOINTS.md`](../docs/frontend/MATRIZ_PANTALLAS_ENDPOINTS.md).

## 7. Estructura

```
frontend/
├── .env.example            URL base de la API (sin secretos)
├── index.html
├── package.json / package-lock.json
└── src/
    ├── main.jsx            Monta la app e importa Bootstrap
    ├── App.jsx             Rutas (públicas, protegidas y layout)
    ├── styles.css
    ├── api/client.js       Axios: URL base, token, 401 global, mensajes de error
    ├── auth/               AuthContext (sesión y rol) y ProtectedRoute
    ├── components/         Compartidos: AppLayout, Paginacion, formularios y DetalleTramite
    ├── pages/              Una página por pantalla
    ├── services/           Un archivo por recurso de la API
    └── utils/formato.js    Formato de colones, fechas y colores de estados
```

Flujo de una acción: **página → servicio → `api` (axios + token) → Django → respuesta → estado de React → la vista se actualiza**.

## 8. Autenticación y seguridad

- **Login:** `POST /api/auth/login/` devuelve `token`, `usuario` y `rol`. Se guardan en `sessionStorage` y se comparten con `AuthContext`.
- **Token en cada solicitud:** un interceptor agrega `Authorization: Token <token>`.
- **Rutas protegidas:** `ProtectedRoute` envía a `/login` si no hay sesión.
- **Logout:** llama a `POST /api/auth/logout/`. **El token sí se revoca en el servidor**: Django lo borra de la tabla de tokens, y si alguien vuelve a usarlo recibe 401. Después se limpia el `sessionStorage`.
- **401:** si Django responde 401 (token inválido o revocado), el interceptor borra la sesión y envía a `/login?sesion=expirada`, que muestra un aviso.
- **403:** los botones se muestran u ocultan según el rol solo para comodidad. **La autorización real la hace Django.** La pantalla `/usuarios` siempre consulta la API, y con Operador o Consulta muestra el 403 que responde el backend.
- **Validaciones:** los formularios revisan campos obligatorios y formatos antes de enviar, pero las reglas reales siguen en Django. Los errores 400 se marcan debajo de cada campo y los 404/409 se muestran en una alerta.

## 9. Limitaciones

- El token no expira solo; únicamente se revoca con el logout (así funciona `TokenAuthentication` de DRF).
- La sesión se guarda en `sessionStorage`: se pierde al cerrar la pestaña.
- Los selectores de relaciones (clientes, cargas, transportistas, trámites) recorren todas las páginas de la API. Con miles de registros convendría un buscador con autocompletado.
- La confirmación antes de eliminar usa `window.confirm` del navegador.
- Solo se probó con el servidor de desarrollo de Vite y `runserver`; no está preparado para producción.
