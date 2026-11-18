import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Qué hace: Se protegen las rutas privadas.
// Qué usa: useAuth, Navigate y Outlet de React Router.
// Cómo lo hace: Si hay sesión se dibuja la ruta hija (Outlet); si no, se redirige a /login.
export default function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
