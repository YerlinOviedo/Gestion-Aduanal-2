import { api, limpiarParametros, obtenerTodos } from '../api/client.js';

// Qué hace: Funciones para consumir el módulo de cargas de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/cargas/ y devuelve los datos de Django.

// GET /api/cargas/?cliente=&tipo=&buscar=&ordenar=&page=  (respuesta paginada)
export async function listarCargas(params) {
    const { data } = await api.get('/cargas/', { params: limpiarParametros(params) });
    return data;
}

// GET /api/cargas/ recorriendo todas las páginas (para selectores)
export async function listarTodosCargas(params) {
    return obtenerTodos('/cargas/', params);
}

// POST /api/cargas/
export async function crearCarga(carga) {
    const { data } = await api.post('/cargas/', carga);
    return data;
}

// PUT /api/cargas/{id}/
export async function actualizarCarga(id, carga) {
    const { data } = await api.put(`/cargas/${id}/`, carga);
    return data;
}

// DELETE /api/cargas/{id}/
export async function eliminarCarga(id) {
    await api.delete(`/cargas/${id}/`);
}
