import axios from 'axios';

// Qué hace: Se crea el cliente HTTP que usan todos los servicios para hablar con Django.
// Qué usa: axios y la variable VITE_API_URL del archivo .env.
// Cómo lo hace: La URL base se lee una sola vez aquí (si no existe se usa la local) y se le quita
//     la barra final. Así ningún componente repite URLs completas.
const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
export const api = axios.create({ baseURL, timeout: 12000 });

// Qué hace: Se agrega el token a cada solicitud.
// Qué usa: Un interceptor de axios y el sessionStorage del navegador.
// Cómo lo hace: Antes de enviar la solicitud se busca el token guardado en el login; si existe,
//     se pone el encabezado "Authorization: Token ..." que espera TokenAuthentication de Django.
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('aduana_token');
    if (token)
        config.headers.Authorization = `Token ${token}`;
    return config;
});

// Qué hace: Se quitan los parámetros vacíos antes de enviarlos a la API.
// Qué usa: Object.entries y filter.
// Cómo lo hace: Se dejan solo los valores que tienen algo. Es necesario porque Django responde
//     400 si recibe, por ejemplo, activo= vacío.
export function limpiarParametros(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined)
    );
}

// Qué hace: Se consultan todas las páginas de un listado paginado.
// Qué usa: api.get y la respuesta paginada de Django (resultados y total_paginas).
// Cómo lo hace: Se pide la página 1, 2, 3... hasta llegar a total_paginas y se juntan los
//     resultados. Se usa para llenar los selectores de relaciones (clientes, cargas, etc.).
export async function obtenerTodos(ruta, params = {}) {
    let pagina = 1;
    let totalPaginas = 1;
    let lista = [];
    do {
        const { data } = await api.get(ruta, { params: { ...limpiarParametros(params), page: pagina } });
        lista = lista.concat(data.resultados ?? []);
        totalPaginas = data.total_paginas ?? 1;
        pagina++;
    } while (pagina <= totalPaginas);
    return lista;
}

// Qué hace: Se convierte un error de axios en un mensaje entendible para el usuario.
// Qué usa: error.response (código HTTP y cuerpo de la respuesta de Django).
// Cómo lo hace: Sin respuesta es un fallo de red. Con respuesta se revisa el código: 401, 403,
//     404 y 409 tienen mensajes propios; en 400 se juntan los errores de cada campo.
export function getError(error) {
    if (!error.response)
        return 'No se puede conectar con Django. Compruebe que el servidor esté encendido.';
    const { status, data } = error.response;
    if (status === 401)
        return 'Su sesión no es válida o expiró. Inicie sesión de nuevo (401).';
    if (status === 403)
        return `${data?.detail || 'Su rol no tiene permiso para realizar esta operación.'} (403)`;
    if (status === 404)
        return `${data?.error || data?.detail || 'El registro no existe.'} (404)`;
    if (status === 409)
        return `${data?.error || 'La operación entra en conflicto con los datos actuales.'} (409)`;
    if (status >= 500 || typeof data === 'string')
        return `Error interno del servidor (HTTP ${status}).`;
    if (data?.error)
        return data.error;
    if (data?.detail)
        return data.detail;
    if (data?.non_field_errors)
        return data.non_field_errors.join(' ');
    if (data && typeof data === 'object')
        return 'Revise los campos marcados: ' + Object.entries(data)
            .map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(' ')}`)
            .join(' | ');
    return `Error HTTP ${status}`;
}

// Qué hace: Se obtienen los errores de validación por campo (respuesta 400 de Django).
// Qué usa: error.response.data, que en un 400 trae { campo: ["mensaje"] }.
// Cómo lo hace: Si es un 400 se devuelve un objeto { campo: "mensaje" } para marcar cada input
//     del formulario; en otro caso se devuelve un objeto vacío.
export function getErroresCampo(error) {
    const data = error.response?.data;
    if (error.response?.status !== 400 || !data || typeof data !== 'object')
        return {};
    return Object.fromEntries(
        Object.entries(data).map(([campo, mensajes]) => [campo, [].concat(mensajes).join(' ')])
    );
}
