import { useState } from 'react';
import { colones, COLOR_ESTADO, COLOR_ESTADO_TRAMITE, fecha } from '../utils/formato.js';

// Estados a los que puede pasar cada estado. Solo sirve para mostrar los botones;
// la regla real la valida Django (tramites/servicios.py).
const SIGUIENTES = {
    REGISTRADO: ['EN_REVISION', 'CANCELADO'],
    EN_REVISION: ['APROBADO', 'CANCELADO'],
    APROBADO: ['LIBERADO', 'CANCELADO'],
    LIBERADO: [],
    CANCELADO: [],
};

const TEXTO_BOTON = {
    EN_REVISION: 'Enviar a revisión',
    APROBADO: 'Aprobar',
    LIBERADO: 'Liberar carga',
    CANCELADO: 'Cancelar trámite',
};

// Qué hace: Panel con el detalle de un trámite: datos, permisos, resumen de cobros y acciones.
// Qué usa: useState para los datos de cada permiso que se va a resolver. Recibe el trámite y las
//     funciones onCambiarEstado, onResolver y onCerrar del módulo.
// Cómo lo hace: Muestra la información vinculada que devuelve Django (carga, cliente,
//     transportista, permisos y cobros). Si el rol puede escribir, muestra los botones del
//     siguiente estado y, en EN_REVISION, el formulario para aprobar o rechazar cada permiso.
export default function DetalleTramite({ tramite, puedeEscribir, procesando, onCambiarEstado, onResolver, onCerrar }) {
    const [resoluciones, setResoluciones] = useState({});

    const cambiar = (permisoId, campo, valor) => {
        setResoluciones(actual => ({
            ...actual,
            [permisoId]: { estado: 'APROBADO', numero: '', ...actual[permisoId], [campo]: valor }
        }));
    };

    const resolver = async (permisoId) => {
        const datos = { estado: 'APROBADO', numero: '', ...resoluciones[permisoId] };
        const correcto = await onResolver(permisoId, datos.estado, datos.numero);
        if (correcto)
            setResoluciones(actual => ({ ...actual, [permisoId]: undefined }));
    };

    const confirmarEstado = (estado) => {
        if (estado === 'CANCELADO' && !window.confirm(`¿Cancelar el trámite ${tramite.codigo}? Los cobros pendientes se anularán.`))
            return;
        onCambiarEstado(estado);
    };

    return (
        <section className="card border-0 shadow-sm mb-4 border-start border-4 border-primary">
            <div className="card-body p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div>
                        <p className="eyebrow mb-1">DETALLE DEL TRÁMITE</p>
                        <h2 className="h4 fw-bold mb-1">
                            {tramite.codigo}{' '}
                            <span className={`badge ${COLOR_ESTADO_TRAMITE[tramite.estado]} align-middle fs-6`}>{tramite.estado}</span>
                        </h2>
                        <p className="text-secondary mb-0">
                            {tramite.tipo} · creado el {fecha(tramite.fecha_creacion)} por {tramite.creado_por || '—'}
                        </p>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>
                        <i className="bi bi-x-lg me-1" />Cerrar
                    </button>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-md-4">
                        <div className="small text-secondary">Carga / cliente</div>
                        <div className="fw-semibold">{tramite.contenedor}</div>
                        <div>{tramite.cliente_nombre}</div>
                    </div>
                    <div className="col-md-4">
                        <div className="small text-secondary">Transportista</div>
                        <div className="fw-semibold">{tramite.transportista_nombre || 'Sin asignar'}</div>
                    </div>
                    <div className="col-md-4">
                        <div className="small text-secondary">Cobros (sin anulados)</div>
                        <div>Total: <strong>{colones(tramite.resumen_cobros.total)}</strong></div>
                        <div className="small">
                            Pagado {colones(tramite.resumen_cobros.pagado)} · Pendiente {colones(tramite.resumen_cobros.pendiente)}
                        </div>
                    </div>
                    {tramite.observaciones && (
                        <div className="col-12">
                            <div className="small text-secondary">Observaciones</div>
                            <div>{tramite.observaciones}</div>
                        </div>
                    )}
                </div>

                {puedeEscribir && SIGUIENTES[tramite.estado].length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        {SIGUIENTES[tramite.estado].map(estado => (
                            <button key={estado} disabled={procesando}
                                className={`btn btn-sm ${estado === 'CANCELADO' ? 'btn-outline-danger' : 'btn-primary'}`}
                                onClick={() => confirmarEstado(estado)}>
                                {TEXTO_BOTON[estado]}
                            </button>
                        ))}
                    </div>
                )}

                <h3 className="h6 fw-bold">Permisos requeridos</h3>
                <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Permiso</th>
                                <th>Institución</th>
                                <th>Estado</th>
                                <th>Resolución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tramite.permisos.length === 0 ? (
                                <tr><td colSpan={4} className="text-secondary text-center py-3">Este trámite no requiere permisos.</td></tr>
                            ) : tramite.permisos.map(p => {
                                const puedeResolver = puedeEscribir && tramite.estado === 'EN_REVISION' && p.estado === 'PENDIENTE';
                                const datos = { estado: 'APROBADO', numero: '', ...resoluciones[p.id] };
                                return (
                                    <tr key={p.id}>
                                        <td><strong>{p.codigo}</strong> {p.nombre}</td>
                                        <td>{p.institucion}</td>
                                        <td><span className={`badge ${COLOR_ESTADO[p.estado]}`}>{p.estado}</span></td>
                                        <td>
                                            {puedeResolver ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    <select className="form-select form-select-sm w-auto" aria-label="Resultado"
                                                        value={datos.estado} onChange={e => cambiar(p.id, 'estado', e.target.value)}>
                                                        <option value="APROBADO">Aprobar</option>
                                                        <option value="RECHAZADO">Rechazar</option>
                                                    </select>
                                                    <input className="form-control form-control-sm w-auto" placeholder="N.º resolución"
                                                        aria-label="Número de resolución" maxLength="30"
                                                        value={datos.numero} onChange={e => cambiar(p.id, 'numero', e.target.value)} />
                                                    <button className="btn btn-sm btn-primary" disabled={procesando}
                                                        onClick={() => resolver(p.id)}>Guardar</button>
                                                </div>
                                            ) : (
                                                <span className="small">{p.numero_resolucion || '—'} {p.fecha_resolucion && `· ${fecha(p.fecha_resolucion)}`}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
