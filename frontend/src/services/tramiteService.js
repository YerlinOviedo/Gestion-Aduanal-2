import { api, limpiarParametros, obtenerTodos } from '../api/client.js';

// Qué hace: Funciones para consumir el módulo de trámites de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/tramites/ y devuelve los datos de Django.

// GET /api/tramites/?estado=&tipo=&cliente=&buscar=&page=  (respuesta paginada)
export async function listarTramites(params) {
    const { data } = await api.get('/tramites/', { params: limpiarParametros(params) });
    return data;
}

// GET /api/tramites/ recorriendo todas las páginas (para selectores)
export async function listarTodosTramites(params) {
    return obtenerTodos('/tramites/', params);
}

// GET /api/tramites/{id}/  (detalle con permisos y resumen de cobros)
export async function obtenerTramite(id) {
    const { data } = await api.get(`/tramites/${id}/`);
    return data;
}

// POST /api/tramites/
export async function crearTramite(tramite) {
    const { data } = await api.post('/tramites/', tramite);
    return data;
}

// PUT /api/tramites/{id}/
export async function actualizarTramite(id, tramite) {
    const { data } = await api.put(`/tramites/${id}/`, tramite);
    return data;
}

// DELETE /api/tramites/{id}/
export async function eliminarTramite(id) {
    await api.delete(`/tramites/${id}/`);
}

// POST /api/tramites/{id}/cambiar-estado/
export async function cambiarEstadoTramite(id, estado) {
    const { data } = await api.post(`/tramites/${id}/cambiar-estado/`, { estado });
    return data;
}

// POST /api/tramites/{id}/resolver-permiso/
export async function resolverPermiso(id, permiso, estado, numero_resolucion) {
    const { data } = await api.post(`/tramites/${id}/resolver-permiso/`, { permiso, estado, numero_resolucion });
    return data;
}
