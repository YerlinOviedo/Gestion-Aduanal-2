import { useAuth } from '../auth/AuthContext.jsx';

// Qué hace: Pantalla inicial después del login.
// Qué usa: useAuth para mostrar el usuario y el rol.
// Cómo lo hace: Muestra un saludo; los indicadores se agregan en el siguiente commit.
export default function Dashboard() {
    const { username, rol } = useAuth();
    return (
        <>
            <p className="eyebrow mb-1">PANEL GENERAL</p>
            <h1 className="h2 fw-bold mb-1">Dashboard</h1>
            <p className="text-secondary">Bienvenido, {username} ({rol}).</p>
        </>
    );
}
