import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Qué hace: Pantalla de inicio de sesión.
// Qué usa: useState para el formulario, useAuth para login y useNavigate para redirigir.
// Cómo lo hace: Al enviar el formulario se llama a login(); si Django acepta las credenciales se
//     va al dashboard, y si no se muestra el mensaje de error.
export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-screen">
            <div className="card login-card shadow-lg border-0">
                <div className="card-body p-4 p-md-5">
                    <div className="brand-icon">
                        <i className="bi bi-box-seam" />
                    </div>
                    <h1 className="h3 fw-bold text-center">Aduana Caldera</h1>
                    <p className="text-secondary text-center mb-4">Inicio de sesión</p>
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    <form onSubmit={submit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Usuario</label>
                            <input
                                id="username"
                                className="form-control form-control-lg"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control form-control-lg"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-100">
                            {loading ? 'Verificando…' : 'Ingresar'}
                        </button>
                    </form>
                    <p className="text-center text-secondary small mt-4 mb-0">
                        Autenticación con Django REST Framework
                    </p>
                </div>
            </div>
        </main>
    );
}
