import { api } from '../api/client.js';

// Qué hace: Funciones para consumir la administración de usuarios de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/auth/usuarios/. Django solo lo permite
//     al rol Administrador; a los demás les responde 403.

// GET /api/auth/usuarios/  (lista sin paginar)
export async function listarUsuarios() {
    const { data } = await api.get('/auth/usuarios/');
    return data;
}

// POST /api/auth/usuarios/
export async function crearUsuario(usuario) {
    const { data } = await api.post('/auth/usuarios/', usuario);
    return data;
}

// PATCH /api/auth/usuarios/{id}/  (PATCH para no exigir la contraseña al editar)
export async function actualizarUsuario(id, usuario) {
    const { data } = await api.patch(`/auth/usuarios/${id}/`, usuario);
    return data;
}

// DELETE /api/auth/usuarios/{id}/
export async function eliminarUsuario(id) {
    await api.delete(`/auth/usuarios/${id}/`);
}
