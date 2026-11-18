// Qué hace: Botones para moverse entre las páginas de un listado.
// Qué usa: Los datos de paginación que devuelve Django (pagina_actual, total_paginas y
//     total_registros) y la función onCambiar que recibe del módulo.
// Cómo lo hace: Muestra en qué página se está y los botones Anterior/Siguiente, que se desactivan
//     en la primera y en la última página. Al hacer clic llama a onCambiar con la nueva página.
export default function Paginacion({ pagina, totalPaginas, totalRegistros, onCambiar }) {
    if (!totalRegistros)
        return null;
    return (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <span className="small text-secondary">
                Página {pagina} de {totalPaginas} · {totalRegistros} registros
            </span>
            <div className="btn-group" role="group" aria-label="Paginación">
                <button className="btn btn-outline-primary btn-sm" disabled={pagina <= 1}
                    onClick={() => onCambiar(pagina - 1)}>
                    <i className="bi bi-chevron-left me-1" />Anterior
                </button>
                <button className="btn btn-outline-primary btn-sm" disabled={pagina >= totalPaginas}
                    onClick={() => onCambiar(pagina + 1)}>
                    Siguiente<i className="bi bi-chevron-right ms-1" />
                </button>
            </div>
        </div>
    );
}
