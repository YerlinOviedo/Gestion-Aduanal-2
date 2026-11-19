import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Opciones del menú. Cada módulo agrega aquí su ruta, nombre e ícono.
const menu = [
    { ruta: '/dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2' },
    { ruta: '/clientes', nombre: 'Clientes', icono: 'bi-building' },
    { ruta: '/transportistas', nombre: 'Transportistas', icono: 'bi-truck' },
    { ruta: '/cargas', nombre: 'Cargas', icono: 'bi-box' },
    { ruta: '/tramites', nombre: 'Trámites', icono: 'bi-file-earmark-text' },
    { ruta: '/cobros', nombre: 'Cobros', icono: 'bi-cash-coin' },
];

// Opciones de seguridad. La pantalla de usuarios solo la puede usar el Administrador;
// con los otros roles Django responde 403 y la pantalla lo muestra.
const seguridad = [
    { ruta: '/usuarios', nombre: 'Usuarios', icono: 'bi-people' },
];

// Qué hace: Estructura común de las pantallas privadas: menú lateral, barra superior y contenido.
// Qué usa: NavLink y Outlet de React Router, useAuth para el usuario, el rol y el logout.
// Cómo lo hace: El menú se arma recorriendo la lista "menu"; NavLink marca como activa la opción
//     de la ruta actual. En el centro, Outlet dibuja la página del módulo sin recargar el
//     navegador. En celulares el menú lateral se oculta y se muestran botones arriba.
export default function AppLayout() {
    const { username, rol, logout } = useAuth();
    const navigate = useNavigate();

    const exit = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="app-shell">
            <aside className="app-sidebar">
                <div className="sidebar-brand">
                    <i className="bi bi-box-seam me-2" />
                    Aduana Caldera
                </div>
                <p className="sidebar-label">OPERACIÓN</p>
                <nav className="nav flex-column gap-1" aria-label="Menú principal">
                    {menu.map(opcion => (
                        <NavLink key={opcion.ruta} to={opcion.ruta}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className={`bi ${opcion.icono}`} />
                            {opcion.nombre}
                        </NavLink>
                    ))}
                </nav>
                <p className="sidebar-label mt-3">SEGURIDAD</p>
                <nav className="nav flex-column gap-1" aria-label="Menú de seguridad">
                    {seguridad.map(opcion => (
                        <NavLink key={opcion.ruta} to={opcion.ruta}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className={`bi ${opcion.icono}`} />
                            {opcion.nombre}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-bottom">React + Django REST Framework API</div>
            </aside>
            <div className="app-main">
                <header className="app-topbar">
                    <span className="d-md-none fw-bold text-primary">
                        <i className="bi bi-box-seam me-2" /> Aduana
                    </span>
                    <div className="ms-auto d-flex align-items-center gap-3">
                        <span className="small text-secondary">
                            <i className="bi bi-person-circle me-2" />
                            {username}
                            <span className="badge text-bg-light border ms-2">{rol}</span>
                        </span>
                        <button className="btn btn-outline-danger btn-sm" onClick={exit}>
                            <i className="bi bi-box-arrow-right me-1" />
                            Salir
                        </button>
                    </div>
                </header>
                <div className="d-md-none px-3 pt-3 d-flex gap-2 flex-wrap">
                    {[...menu, ...seguridad].map(opcion => (
                        <NavLink key={opcion.ruta} to={opcion.ruta} className="btn btn-outline-primary btn-sm">
                            {opcion.nombre}
                        </NavLink>
                    ))}
                </div>
                <main className="container-fluid p-3 p-md-4 p-lg-5"><Outlet /></main>
            </div>
        </div>
    );
}
