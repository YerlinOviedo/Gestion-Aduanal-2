import { api, limpiarParametros, obtenerTodos } from '../api/client.js';

// Qué hace: Funciones para consumir el módulo de transportistas de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/transportistas/ y devuelve los datos de Django.

// GET /api/transportistas/?activo=&licencia_vigente=&page=  (respuesta paginada)
export async function listarTransportistas(params) {
    const { data } = await api.get('/transportistas/', { params: limpiarParametros(params) });
    return data;
}

// GET /api/transportistas/ recorriendo todas las páginas (para selectores)
export async function listarTodosTransportistas(params) {
    return obtenerTodos('/transportistas/', params);
}

// POST /api/transportistas/
export async function crearTransportista(transportista) {
    const { data } = await api.post('/transportistas/', transportista);
    return data;
}

// PUT /api/transportistas/{id}/
export async function actualizarTransportista(id, transportista) {
    const { data } = await api.put(`/transportistas/${id}/`, transportista);
    return data;
}

// DELETE /api/transportistas/{id}/
export async function eliminarTransportista(id) {
    await api.delete(`/transportistas/${id}/`);
}
