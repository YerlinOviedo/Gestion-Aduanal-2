// Funciones pequeñas para mostrar datos con un formato fácil de leer.

// Qué hace: Se da formato de colones a un monto (₡1 250 000,00).
// Qué usa: Intl.NumberFormat del navegador con la configuración de Costa Rica.
// Cómo lo hace: Django envía los montos como texto ("1250000.00"); se pasan a número y se formatean.
export function colones(valor) {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(Number(valor || 0));
}

// Qué hace: Se muestra una fecha o fecha-hora de Django como dd/mm/aaaa.
// Qué usa: toLocaleDateString del navegador.
// Cómo lo hace: Si viene solo la fecha (aaaa-mm-dd) se le agrega la hora para que no cambie de día
//     por la zona horaria. Si no hay fecha se devuelve un guion.
export function fecha(valor) {
    if (!valor)
        return '—';
    const texto = valor.length === 10 ? `${valor}T00:00:00` : valor;
    return new Date(texto).toLocaleDateString('es-CR');
}

// Colores de Bootstrap para el estado de cada trámite (los estados vienen de Django).
export const COLOR_ESTADO_TRAMITE = {
    REGISTRADO: 'text-bg-secondary',
    EN_REVISION: 'text-bg-warning',
    APROBADO: 'text-bg-info',
    LIBERADO: 'text-bg-success',
    CANCELADO: 'text-bg-danger',
};

// Colores de Bootstrap para el estado de cobros y permisos.
export const COLOR_ESTADO = {
    PENDIENTE: 'text-bg-warning',
    PAGADO: 'text-bg-success',
    APROBADO: 'text-bg-success',
    ANULADO: 'text-bg-secondary',
    RECHAZADO: 'text-bg-danger',
};
