import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clientes from './pages/Clientes.jsx';
import Transportistas from './pages/Transportistas.jsx';
import Cargas from './pages/Cargas.jsx';
import Tramites from './pages/Tramites.jsx';

// Qué hace: Ruta del login.
// Qué usa: useAuth y Navigate.
// Cómo lo hace: Si el usuario ya inició sesión se envía al inicio; si no, se muestra el login.
function LoginRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

// Qué hace: Se definen todas las rutas de la aplicación (SPA).
// Qué usa: AuthProvider, BrowserRouter, Routes y Route de React Router.
// Cómo lo hace: AuthProvider comparte la sesión con todas las páginas. Las rutas privadas van
//     dentro de ProtectedRoute (exige sesión) y de AppLayout (menú y barra superior).
//     Cualquier ruta desconocida se envía al dashboard.
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginRoute />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/transportistas" element={<Transportistas />} />
                            <Route path="/cargas" element={<Cargas />} />
                            <Route path="/tramites" element={<Tramites />} />
                        </Route>
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
