import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FormCobro from '../components/FormCobro.jsx';
import Paginacion from '../components/Paginacion.jsx';
import {
    actualizarCobro,
    anularCobro,
    crearCobro,
    eliminarCobro,
    listarCobros,
    registrarPago
} from '../services/cobroService.js';
import { listarTodosTramites } from '../services/tramiteService.js';
import { colones, COLOR_ESTADO, fecha } from '../utils/formato.js';

const ABIERTOS = ['REGISTRADO', 'EN_REVISION', 'APROBADO'];

// Qué hace: Pantalla del módulo de cobros: listado con filtros combinables, ordenamiento y
//     paginación, CRUD, registro de pago y anulación.
// Qué usa: useState, useEffect, useCallback, los servicios de cobros y trámites, FormCobro,
//     Paginacion y useAuth.
// Cómo lo hace: El listado se pide a Django con los filtros juntos
//     (GET /api/cobros/?estado=&concepto=&ordenar=&page=). Solo los cobros PENDIENTES se pueden
//     editar, pagar, anular o eliminar; el backend lo vuelve a validar y responde 409 si no.
export default function Cobros() {
    const { puedeEscribir, esAdmin } = useAuth();
    const [cobros, setCobros] = useState([]);
    const [tramites, setTramites] = useState([]);
    const [paginacion, setPaginacion] = useState({ total_paginas: 1, total_registros: 0 });
    const [pagina, setPagina] = useState(1);
    const [filtros, setFiltros] = useState({ estado: '', concepto: '', ordenar: '-fecha_emision' });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [pagando, setPagando] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Se consultan los trámites abiertos para el selector del formulario.
    useEffect(() => {
        listarTodosTramites()
            .then(lista => setTramites(lista.filter(t => ABIERTOS.includes(t.estado))))
            .catch(e => setError(getError(e)));
    }, []);

    // Qué hace: Se consulta la página actual de cobros con los filtros y el orden.
    // Qué usa: listarCobros (GET /api/cobros/).
    // Cómo lo hace: Se piden los datos y se guardan los resultados y la paginación.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const data = await listarCobros({ ...filtros, page: pagina });
            setCobros(data.resultados);
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

    // Qué hace: Se ejecuta una acción sobre un cobro y se recarga el listado.
    // Qué usa: La función del servicio que se recibe (pagar, anular o eliminar).
    // Cómo lo hace: Se limpian los mensajes, se llama a Django y se muestra el resultado.
    const ejecutar = async (accion, mensaje) => {
        setGuardando(true);
        setError('');
        setExito('');
        try {
            await accion();
            setExito(mensaje);
            await recargar();
        } catch (e) {
            setError(getError(e));
        } finally {
            setGuardando(false);
        }
    };

    // Qué hace: Se registra o actualiza un cobro.
    // Qué usa: crearCobro (POST) o actualizarCobro (PUT).
    // Cómo lo hace: Si el trámite ya tiene un cobro vigente del mismo concepto, Django responde
    //     409; si el trámite está cerrado, 400. Ambos mensajes se muestran.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                await actualizarCobro(editando.id, datos);
                setEditando(null);
                setExito('Cobro actualizado correctamente.');
            } else {
                const creado = await crearCobro(datos);
                setExito(`Cobro registrado con la factura ${creado.numero_factura}.`);
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

    // POST /api/cobros/{id}/registrar-pago/
    const pagar = () => {
        const { cobro, metodo } = pagando;
        setPagando(null);
        ejecutar(() => registrarPago(cobro.id, metodo), `Pago registrado para la factura ${cobro.numero_factura}.`);
    };

    // POST /api/cobros/{id}/anular/  (solo Administrador)
    const anular = (cobro) => {
        if (!window.confirm(`¿Anular la factura ${cobro.numero_factura}?`))
            return;
        ejecutar(() => anularCobro(cobro.id), `Factura ${cobro.numero_factura} anulada.`);
    };

    // DELETE /api/cobros/{id}/  (solo Administrador)
    const eliminar = (cobro) => {
        if (!window.confirm(`¿Eliminar la factura ${cobro.numero_factura}?`))
            return;
        if (editando?.id === cobro.id)
            setEditando(null);
        ejecutar(() => eliminarCobro(cobro.id), 'Cobro eliminado correctamente.');
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">MÓDULOS / COBROS</p>
                <h1 className="h2 fw-bold mb-1">Cobros</h1>
                <p className="text-secondary mb-0">
                    Montos facturados por cada trámite. La carga solo se libera con todos los cobros pagados.
                </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            {puedeEscribir ? (
                <FormCobro
                    cobro={editando}
                    tramites={tramites}
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

            {pagando && (
                <section className="card border-0 shadow-sm mb-4 border-start border-4 border-success">
                    <div className="card-body p-4 d-flex flex-wrap align-items-end gap-3">
                        <div>
                            <p className="eyebrow mb-1">REGISTRAR PAGO</p>
                            <div className="fw-semibold">
                                {pagando.cobro.numero_factura} · {colones(pagando.cobro.monto)}
                            </div>
                        </div>
                        <div>
                            <label className="form-label" htmlFor="metodo_pago">Método de pago *</label>
                            <select id="metodo_pago" className="form-select" value={pagando.metodo}
                                onChange={e => setPagando(actual => ({ ...actual, metodo: e.target.value }))}>
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="TARJETA">Tarjeta</option>
                            </select>
                        </div>
                        <button className="btn btn-success" onClick={pagar} disabled={guardando}>
                            <i className="bi bi-check2 me-1" />Confirmar pago
                        </button>
                        <button className="btn btn-outline-secondary" onClick={() => setPagando(null)}>Cancelar</button>
                    </div>
                </section>
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
                        <div className="col-md-4">
                            <select className="form-select" aria-label="Filtrar por estado"
                                value={filtros.estado} onChange={e => cambiarFiltro('estado', e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="PAGADO">Pagados</option>
                                <option value="ANULADO">Anulados</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" aria-label="Filtrar por concepto"
                                value={filtros.concepto} onChange={e => cambiarFiltro('concepto', e.target.value)}>
                                <option value="">Todos los conceptos</option>
                                <option value="ALMACENAJE">Almacenaje</option>
                                <option value="DESALMACENAJE">Desalmacenaje</option>
                                <option value="TRANSPORTE">Transporte</option>
                                <option value="HONORARIOS">Honorarios</option>
                                <option value="IMPUESTOS">Impuestos</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" aria-label="Ordenar cobros"
                                value={filtros.ordenar} onChange={e => cambiarFiltro('ordenar', e.target.value)}>
                                <option value="-fecha_emision">Emisión: más recientes</option>
                                <option value="fecha_emision">Emisión: más antiguos</option>
                                <option value="-monto">Monto: mayor a menor</option>
                                <option value="monto">Monto: menor a mayor</option>
                                <option value="-fecha_pago">Pago: más recientes</option>
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="text-secondary py-4">
                            <span className="spinner-border spinner-border-sm me-2" />Cargando cobros...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Factura</th>
                                        <th>Trámite</th>
                                        <th>Cliente</th>
                                        <th>Concepto</th>
                                        <th className="text-end">Monto</th>
                                        <th>Estado</th>
                                        <th>Emisión</th>
                                        {puedeEscribir && <th className="text-end">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cobros.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-secondary py-4">
                                                No hay cobros para mostrar.
                                            </td>
                                        </tr>
                                    ) : cobros.map(c => (
                                        <tr key={c.id}>
                                            <td className="fw-semibold">{c.numero_factura}</td>
                                            <td>{c.tramite_codigo}</td>
                                            <td>{c.cliente_nombre}</td>
                                            <td>{c.concepto}</td>
                                            <td className="text-end">{colones(c.monto)}</td>
                                            <td>
                                                <span className={`badge ${COLOR_ESTADO[c.estado]}`}>{c.estado}</span>
                                                {c.metodo_pago && <div className="small text-secondary">{c.metodo_pago} · {fecha(c.fecha_pago)}</div>}
                                            </td>
                                            <td>{fecha(c.fecha_emision)}</td>
                                            {puedeEscribir && (
                                                <td className="text-end text-nowrap">
                                                    {c.estado === 'PENDIENTE' && (
                                                        <>
                                                            <button className="btn btn-outline-success btn-sm me-2"
                                                                onClick={() => setPagando({ cobro: c, metodo: 'TRANSFERENCIA' })}>
                                                                <i className="bi bi-cash me-1" />Pagar
                                                            </button>
                                                            <button className="btn btn-outline-primary btn-sm me-2" title="Editar" aria-label="Editar"
                                                                onClick={() => {
                                                                    setEditando(c);
                                                                    setErroresCampo({});
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}>
                                                                <i className="bi bi-pencil" />
                                                            </button>
                                                            {esAdmin && (
                                                                <>
                                                                    <button className="btn btn-outline-warning btn-sm me-2" onClick={() => anular(c)}>
                                                                        Anular
                                                                    </button>
                                                                    <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(c)}
                                                                        title="Eliminar" aria-label="Eliminar">
                                                                        <i className="bi bi-trash" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                            )}
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
