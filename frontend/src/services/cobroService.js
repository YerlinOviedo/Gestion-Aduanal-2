import { api, limpiarParametros } from '../api/client.js';

// Qué hace: Funciones para consumir el módulo de cobros de la API.
// Qué usa: El cliente api (axios) con la URL base y el token ya configurados.
// Cómo lo hace: Cada función llama a un endpoint de /api/cobros/ y devuelve los datos de Django.

// GET /api/cobros/?estado=&concepto=&tramite=&cliente=&ordenar=&page=  (respuesta paginada)
export async function listarCobros(params) {
    const { data } = await api.get('/cobros/', { params: limpiarParametros(params) });
    return data;
}

// POST /api/cobros/
export async function crearCobro(cobro) {
    const { data } = await api.post('/cobros/', cobro);
    return data;
}

// PUT /api/cobros/{id}/
export async function actualizarCobro(id, cobro) {
    const { data } = await api.put(`/cobros/${id}/`, cobro);
    return data;
}

// DELETE /api/cobros/{id}/
export async function eliminarCobro(id) {
    await api.delete(`/cobros/${id}/`);
}

// POST /api/cobros/{id}/registrar-pago/
export async function registrarPago(id, metodo_pago) {
    const { data } = await api.post(`/cobros/${id}/registrar-pago/`, { metodo_pago });
    return data;
}

// POST /api/cobros/{id}/anular/
export async function anularCobro(id) {
    const { data } = await api.post(`/cobros/${id}/anular/`);
    return data;
}
