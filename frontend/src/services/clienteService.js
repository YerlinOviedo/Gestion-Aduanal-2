import { api, limpiarParametros, obtenerTodos } from '../api/client.js';

// Qué hace: Funciones para consumir el módulo de clientes de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/clientes/ y devuelve los datos de Django.

// GET /api/clientes/?activo=&buscar=&page=  (respuesta paginada)
export async function listarClientes(params) {
    const { data } = await api.get('/clientes/', { params: limpiarParametros(params) });
    return data;
}

// GET /api/clientes/ recorriendo todas las páginas (para selectores)
export async function listarTodosClientes(params) {
    return obtenerTodos('/clientes/', params);
}

// POST /api/clientes/
export async function crearCliente(cliente) {
    const { data } = await api.post('/clientes/', cliente);
    return data;
}

// PUT /api/clientes/{id}/
export async function actualizarCliente(id, cliente) {
    const { data } = await api.put(`/clientes/${id}/`, cliente);
    return data;
}

// DELETE /api/clientes/{id}/
export async function eliminarCliente(id) {
    await api.delete(`/clientes/${id}/`);
}
