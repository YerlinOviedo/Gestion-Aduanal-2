import { createContext, useContext, useState } from 'react';
import { api, getError } from '../api/client.js';

const AuthContext = createContext(null);

// Roles que vienen de Django (cuentas/permisos.py).
export const ADMINISTRADOR = 'Administrador';
export const OPERADOR = 'Operador';
export const CONSULTA = 'Consulta';

// Qué hace: Se comparte el estado de la sesión (token, usuario y rol) con toda la aplicación.
// Qué usa: createContext, useState, el cliente api y el sessionStorage del navegador.
// Cómo lo hace: Los datos se leen del sessionStorage al cargar la página, para no perder la
//     sesión al recargar. login y logout los guardan o los borran y actualizan el estado.
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => sessionStorage.getItem('aduana_token'));
    const [username, setUsername] = useState(() => sessionStorage.getItem('aduana_username') || '');
    const [rol, setRol] = useState(() => sessionStorage.getItem('aduana_rol') || '');

    // Qué hace: Se inicia sesión con usuario y contraseña.
    // Qué usa: POST /api/auth/login/ (vista login_api del backend).
    // Cómo lo hace: Django valida las credenciales y devuelve token, usuario y rol; se guardan en
    //     el sessionStorage y en el estado. Si falla, se lanza un error con el mensaje de Django.
    async function login(usernameInput, password) {
        try {
            const { data } = await api.post('/auth/login/', { username: usernameInput, password });
            if (!data?.token)
                throw new Error('El servidor no devolvió el token.');
            sessionStorage.setItem('aduana_token', data.token);
            sessionStorage.setItem('aduana_username', data.usuario);
            sessionStorage.setItem('aduana_rol', data.rol);
            setToken(data.token);
            setUsername(data.usuario);
            setRol(data.rol);
        } catch (error) {
            throw new Error(error.response ? getError(error) : error.message);
        }
    }

    // Qué hace: Se cierra la sesión.
    // Qué usa: POST /api/auth/logout/ (vista logout_api) y el sessionStorage.
    // Cómo lo hace: Primero se pide a Django que borre el token (queda revocado en el servidor).
    //     Aunque esa llamada falle, siempre se limpia la sesión local.
    async function logout() {
        try {
            await api.post('/auth/logout/');
        } catch {
            // Si el token ya no existe en Django, igual se limpia la sesión local.
        }
        sessionStorage.removeItem('aduana_token');
        sessionStorage.removeItem('aduana_username');
        sessionStorage.removeItem('aduana_rol');
        setToken(null);
        setUsername('');
        setRol('');
    }

    // Permisos para mostrar u ocultar botones. La seguridad real la sigue haciendo Django.
    const puedeEscribir = rol === ADMINISTRADOR || rol === OPERADOR;
    const esAdmin = rol === ADMINISTRADOR;

    return <AuthContext.Provider value={{
        login, logout, token, username, rol, puedeEscribir, esAdmin,
        isAuthenticated: Boolean(token)
    }}>
        {children}
    </AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
