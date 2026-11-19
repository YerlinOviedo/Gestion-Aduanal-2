import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import DetalleTramite from '../components/DetalleTramite.jsx';
import FormTramite from '../components/FormTramite.jsx';
import Paginacion from '../components/Paginacion.jsx';
import { listarTodosCargas } from '../services/cargaService.js';
import { listarTodosClientes } from '../services/clienteService.js';
import {
    actualizarTramite,
    cambiarEstadoTramite,
    crearTramite,
    eliminarTramite,
    listarTramites,
    obtenerTramite,
    resolverPermiso
} from '../services/tramiteService.js';
import { listarTodosTransportistas } from '../services/transportistaService.js';
import { COLOR_ESTADO_TRAMITE, fecha } from '../utils/formato.js';

const CERRADOS = ['LIBERADO', 'CANCELADO'];

// Qué hace: Pantalla del módulo de trámites: listado con filtros, búsqueda y paginación, CRUD,
//     detalle con información vinculada, cambio de estado y resolución de permisos.
// Qué usa: useState, useEffect, useCallback, los servicios de trámites, cargas, clientes y
//     transportistas, FormTramite, DetalleTramite, Paginacion y useAuth.
// Cómo lo hace: Al abrir se cargan las listas para los selectores. El listado se pide a Django
//     con los filtros (GET /api/tramites/?estado=&tipo=&cliente=&buscar=&page=). Al cambiar el
//     estado de un trámite cambian también otras entidades (por ejemplo, se anulan cobros), por
//     eso después de cada acción se vuelve a consultar el detalle y el listado.
export default function Tramites() {
    const { puedeEscribir, esAdmin } = useAuth();
    const [tramites, setTramites] = useState([]);
    const [cargas, setCargas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [transportistas, setTransportistas] = useState([]);
    const [paginacion, setPaginacion] = useState({ total_paginas: 1, total_registros: 0 });
    const [pagina, setPagina] = useState(1);
    const [filtros, setFiltros] = useState({ estado: '', tipo: '', cliente: '', buscar: '' });
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Se consultan las listas de las relaciones una sola vez.
    useEffect(() => {
        Promise.all([listarTodosCargas(), listarTodosClientes(), listarTodosTransportistas()])
            .then(([listaCargas, listaClientes, listaTransportistas]) => {
                setCargas(listaCargas);
                setClientes(listaClientes);
                setTransportistas(listaTransportistas);
            })
            .catch(e => setError(getError(e)));
    }, []);

    // Qué hace: Se consulta la página actual de trámites con los filtros.
    // Qué usa: listarTramites (GET /api/tramites/).
    // Cómo lo hace: Se piden los datos y se guardan los resultados y la paginación.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const data = await listarTramites({ ...filtros, page: pagina });
            setTramites(data.resultados);
            setPaginacion(data);
        } catch (e) {
            setError(getError(e));
        } finally {
            setCargando(false);
        }
    }, [filtros, pagina]);

    useEffect(() => {
        recargar();
    }, [recargar]);

    const cambiarFiltro = (nombre, valor) => {
        setFiltros(actual => ({ ...actual, [nombre]: valor }));
        setPagina(1);
    };

    const buscar = (evento) => {
        evento.preventDefault();
        cambiarFiltro('buscar', texto.trim());
    };

    // Qué hace: Se abre el detalle de un trámite.
    // Qué usa: obtenerTramite (GET /api/tramites/{id}/).
    // Cómo lo hace: Se consulta el trámite actualizado y se muestra en el panel de detalle.
    const verDetalle = async (id) => {
        setError('');
        try {
            setDetalle(await obtenerTramite(id));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            setError(getError(e));
        }
    };

    // Qué hace: Se registra o actualiza un trámite.
    // Qué usa: crearTramite (POST) o actualizarTramite (PUT).
    // Cómo lo hace: Si Django responde 409 (la carga ya tiene un trámite activo) o 400, se muestra
    //     el mensaje. Al crear, se abre el detalle para ver los permisos que asignó el backend.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                const actualizado = await actualizarTramite(editando.id, datos);
                setEditando(null);
                if (detalle?.id === actualizado.id)
                    setDetalle(actualizado);
                setExito('Trámite actualizado correctamente.');
            } else {
                const creado = await crearTramite(datos);
                setDetalle(creado);
                setExito(`Trámite ${creado.codigo} registrado. Se asignaron ${creado.permisos.length} permisos.`);
            }
            await recargar();
            return true;
        } catch (e) {
            setError(getError(e));
            setErroresCampo(getErroresCampo(e));
            return false;
        } finally {
            setGuardando(false);
        }
    };

    // Qué hace: Se elimina un trámite después de confirmar.
    // Qué usa: eliminarTramite (DELETE).
    // Cómo lo hace: Django solo permite borrar trámites REGISTRADOS sin cobros; si no, responde 409.
    const eliminar = async (tramite) => {
        if (!window.confirm(`¿Eliminar el trámite ${tramite.codigo}?`))
            return;
        setError('');
        setExito('');
        try {
            await eliminarTramite(tramite.id);
            if (detalle?.id === tramite.id)
                setDetalle(null);
            if (editando?.id === tramite.id)
                setEditando(null);
            setExito('Trámite eliminado correctamente.');
            await recargar();
        } catch (e) {
            setError(getError(e));
        }
    };

    // Qué hace: Se cambia el estado del trámite abierto en el detalle.
    // Qué usa: cambiarEstadoTramite (POST /api/tramites/{id}/cambiar-estado/).
    // Cómo lo hace: Django revisa las reglas (permisos aprobados, cobros pagados, transportista
    //     habilitado). Si no se cumplen, responde 400 o 409 y se muestra el motivo.
    const cambiarEstado = async (estado) => {
        setGuardando(true);
        setError('');
        setExito('');
        try {
            const actualizado = await cambiarEstadoTramite(detalle.id, estado);
            setDetalle(actualizado);
            setExito(`El trámite ${actualizado.codigo} pasó a ${actualizado.estado}.`);
            await recargar();
        } catch (e) {
            setError(getError(e));
        } finally {
            setGuardando(false);
        }
    };

    // Qué hace: Se aprueba o rechaza un permiso del trámite abierto.
    // Qué usa: resolverPermiso (POST /api/tramites/{id}/resolver-permiso/).
    // Cómo lo hace: Se envía el permiso, el resultado y el número de resolución; luego se vuelve a
    //     consultar el detalle para ver el permiso actualizado.
    const resolver = async (permisoId, estado, numero) => {
        setGuardando(true);
        setError('');
        setExito('');
        try {
            await resolverPermiso(detalle.id, permisoId, estado, numero);
            setDetalle(await obtenerTramite(detalle.id));
            setExito('Permiso resuelto correctamente.');
            return true;
        } catch (e) {
            setError(getError(e));
            return false;
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">MÓDULOS / TRÁMITES</p>
                <h1 className="h2 fw-bold mb-1">Trámites aduanales</h1>
                <p className="text-secondary mb-0">
                    Proceso de cada contenedor: revisión, permisos, aprobación y liberación.
                </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            {detalle && (
                <DetalleTramite
                    tramite={detalle}
                    puedeEscribir={puedeEscribir}
                    procesando={guardando}
                    onCambiarEstado={cambiarEstado}
                    onResolver={resolver}
                    onCerrar={() => setDetalle(null)}
                />
            )}

            {puedeEscribir ? (
                <FormTramite
                    tramite={editando}
                    cargas={cargas}
                    transportistas={transportistas}
                    onSave={guardar}
                    onCancel={() => { setEditando(null); setErroresCampo({}); }}
                    saving={guardando}
                    errores={erroresCampo}
                />
            ) : (
                <div className="alert alert-info">
                    <i className="bi bi-eye me-2" />Su rol solo permite consultar la información.
                </div>
            )}

            <section className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                        <h2 className="h5 mb-0 fw-bold">Listado ({paginacion.total_registros})</h2>
                        <button className="btn btn-outline-primary btn-sm" onClick={recargar} disabled={cargando}>
                            <i className="bi bi-arrow-clockwise me-1" />Actualizar
                        </button>
                    </div>

                    <div className="filtros row g-2 mb-3">
                        <form className="col-lg-4 d-flex gap-2" onSubmit={buscar}>
                            <input className="form-control" aria-label="Buscar trámites"
                                placeholder="Código, contenedor o cliente..."
                                value={texto} onChange={e => setTexto(e.target.value)} />
                            <button type="submit" className="btn btn-primary"><i className="bi bi-search" /></button>
                        </form>
                        <div className="col-sm-4 col-lg-3">
                            <select className="form-select" aria-label="Filtrar por estado"
                                value={filtros.estado} onChange={e => cambiarFiltro('estado', e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="REGISTRADO">Registrado</option>
                                <option value="EN_REVISION">En revisión</option>
                                <option value="APROBADO">Aprobado</option>
                                <option value="LIBERADO">Liberado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                        <div className="col-sm-4 col-lg-2">
                            <select className="form-select" aria-label="Filtrar por tipo"
                                value={filtros.tipo} onChange={e => cambiarFiltro('tipo', e.target.value)}>
                                <option value="">Todos los tipos</option>
                                <option value="IMPORTACION">Importación</option>
                                <option value="EXPORTACION">Exportación</option>
                                <option value="TRANSITO">Tránsito</option>
                            </select>
                        </div>
                        <div className="col-sm-4 col-lg-3">
                            <select className="form-select" aria-label="Filtrar por cliente"
                                value={filtros.cliente} onChange={e => cambiarFiltro('cliente', e.target.value)}>
                                <option value="">Todos los clientes</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="text-secondary py-4">
                            <span className="spinner-border spinner-border-sm me-2" />Cargando trámites...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Código</th>
                                        <th>Contenedor</th>
                                        <th>Cliente</th>
                                        <th>Transportista</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Creado</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tramites.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-secondary py-4">
                                                No hay trámites para mostrar.
                                            </td>
                                        </tr>
                                    ) : tramites.map(t => (
                                        <tr key={t.id} className={detalle?.id === t.id ? 'table-active' : ''}>
                                            <td className="fw-semibold text-nowrap">{t.codigo}</td>
                                            <td>{t.contenedor}</td>
                                            <td>{t.cliente_nombre}</td>
                                            <td>{t.transportista_nombre || <span className="text-secondary">Sin asignar</span>}</td>
                                            <td className="small">{t.tipo}</td>
                                            <td><span className={`badge ${COLOR_ESTADO_TRAMITE[t.estado]}`}>{t.estado}</span></td>
                                            <td>{fecha(t.fecha_creacion)}</td>
                                            <td className="text-end text-nowrap">
                                                <button className="btn btn-outline-secondary btn-sm me-1" title="Ver detalle"
                                                    aria-label="Ver detalle" onClick={() => verDetalle(t.id)}>
                                                    <i className="bi bi-eye" />
                                                </button>
                                                {puedeEscribir && !CERRADOS.includes(t.estado) && (
                                                    <button className="btn btn-outline-primary btn-sm me-1" title="Editar" aria-label="Editar"
                                                        onClick={() => {
                                                            setEditando(t);
                                                            setErroresCampo({});
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}>
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                )}
                                                {esAdmin && t.estado === 'REGISTRADO' && (
                                                    <button className="btn btn-outline-danger btn-sm" title="Eliminar" aria-label="Eliminar"
                                                        onClick={() => eliminar(t)}>
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Paginacion
                        pagina={paginacion.pagina_actual ?? pagina}
                        totalPaginas={paginacion.total_paginas}
                        totalRegistros={paginacion.total_registros}
                        onCambiar={setPagina}
                    />
                </div>
            </section>
        </>
    );
}
