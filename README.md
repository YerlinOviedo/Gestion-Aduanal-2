# Trámites Aduanales · Proyectos 1 y 2

Desarrollo de Software IV · Universidad de Costa Rica, Sede del Pacífico

| Integrante | Carné |
|---|---|
| José David Jiménez Araya | C5G177 |
| Yerlin Oviedo Castro | C5I097 |

Sistema para una agencia aduanal en Puerto Caldera.

| Carpeta | Contenido |
|---|---|
| [`backend/`](backend/README.md) | Proyecto 1: API REST con Django REST Framework y MySQL |
| [`frontend/`](frontend/README.md) | Proyecto 2: SPA con React, Vite y Bootstrap 5 que consume la API |
| [`docs/frontend/`](docs/frontend/) | Matrices de pantallas/endpoints y de perfiles, evidencias y capturas del Proyecto 2 |

## Ejecución rápida

```bash
# Terminal 1: backend
cd backend
python -m venv venv
venv\Scripts\activate            # Linux / macOS: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # completar DB_PASSWORD, DJANGO_SECRET_KEY y DEMO_PASSWORD
python manage.py migrate
python manage.py cargar_datos
python manage.py runserver

# Terminal 2: frontend
cd frontend
npm install
copy .env.example .env
npm run dev
```

Abrir `http://localhost:5173` e ingresar con `admin_demo`, `operador_demo` o `consulta_demo` (contraseña = `DEMO_PASSWORD`). Los detalles están en el README de cada carpeta.
