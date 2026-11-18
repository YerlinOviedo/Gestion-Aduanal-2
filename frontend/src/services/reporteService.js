import { api } from '../api/client.js';

// Qué hace: Funciones para consumir los reportes (consultas ORM) que usa el dashboard.
// Qué usa: El cliente api con la URL base y el token.
// Cómo lo hace: Cada función llama a un endpoint de /api/reportes/ y devuelve los datos.

// GET /api/reportes/tramites-por-estado/
export async function tramitesPorEstado() {
    const { data } = await api.get('/reportes/tramites-por-estado/');
    return data;
}

// GET /api/reportes/ingresos/  (por defecto, el mes actual)
export async function ingresosDelMes() {
    const { data } = await api.get('/reportes/ingresos/');
    return data;
}

// GET /api/reportes/listos-para-liberar/
export async function listosParaLiberar() {
    const { data } = await api.get('/reportes/listos-para-liberar/');
    return data;
}

// GET /api/reportes/resumen-clientes/?solo_con_saldo=true
export async function clientesConSaldo() {
    const { data } = await api.get('/reportes/resumen-clientes/', { params: { solo_con_saldo: true } });
    return data;
}

// GET /api/reportes/licencias-por-vencer/?dias=30
export async function licenciasPorVencer(dias = 30) {
    const { data } = await api.get('/reportes/licencias-por-vencer/', { params: { dias } });
    return data;
}
