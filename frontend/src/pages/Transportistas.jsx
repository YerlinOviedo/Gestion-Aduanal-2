import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FormTransportista from '../components/FormTransportista.jsx';
import Paginacion from '../components/Paginacion.jsx';
import {
    actualizarTransportista,
    crearTransportista,
    eliminarTransportista,
    listarTransportistas
} from '../services/transportistaService.js';
import { fecha } from '../utils/formato.js';

// Qué hace: Pantalla del módulo de transportistas: listado, filtros combinables, paginación y CRUD.
// Qué usa: useState, useEffect, useCallback, el servicio de transportistas, FormTransportista,
//     Paginacion y useAuth.
// Cómo lo hace: Los filtros "estado" y "licencia" se envían juntos a Django
//     (GET /api/transportistas/?activo=&licencia_vigente=&page=), que es quien los aplica.
export default function Transportistas() {
    const { puedeEscribir, esAdmin } = useAuth();
    const [transportistas, setTransportistas] = useState([]);
    const [paginacion, setPaginacion] = useState({ total_paginas: 1, total_registros: 0 });
    const [pagina, setPagina] = useState(1);
    const [filtros, setFiltros] = useState({ activo: '', licencia_vigente: '' });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Qué hace: Se consulta la página actual de transportistas con los filtros aplicados.
    // Qué usa: listarTransportistas (GET /api/transportistas/).
    // Cómo lo hace: Se piden los datos y se guardan los resultados y la paginación.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const data = await listarTransportistas({ ...filtros, page: pagina });
            setTransportistas(data.resultados);
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

    // Qué hace: Se registra o actualiza un transportista.
    // Qué usa: crearTransportista (POST) o actualizarTransportista (PUT).
    // Cómo lo hace: Según haya uno en edición; los errores 400 se marcan en el formulario.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                await actualizarTransportista(editando.id, datos);
                setEditando(null);
                setExito('Transportista actualizado correctamente.');
            } else {
                await crearTransportista(datos);
                setExito('Transportista registrado correctamente.');
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

    // Qué hace: Se elimina un transportista después de confirmar.
    // Qué usa: eliminarTransportista (DELETE).
    // Cómo lo hace: Si tiene trámites, Django responde 409 y se muestra el mensaje.
    const eliminar = async (t) => {
        if (!window.confirm(`¿Eliminar el transportista "${t.nombre}"?`))
            return;
        setError('');
        setExito('');
        try {
            await eliminarTransportista(t.id);
            if (editando?.id === t.id)
                setEditando(null);
            setExito('Transportista eliminado correctamente.');
            await recargar();
        } catch (e) {
            setError(getError(e));
        }
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">MÓDULOS / TRANSPORTISTAS</p>
                <h1 className="h2 fw-bold mb-1">Transportistas</h1>
                <p className="text-secondary mb-0">
                    Choferes de cabezal que retiran los contenedores del puerto.
                </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            {puedeEscribir ? (
                <FormTransportista
                    transportista={editando}
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
                        <div className="col-md-6">
                            <select className="form-select" aria-label="Filtrar por estado"
                                value={filtros.activo} onChange={e => cambiarFiltro('activo', e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <select className="form-select" aria-label="Filtrar por licencia"
                                value={filtros.licencia_vigente} onChange={e => cambiarFiltro('licencia_vigente', e.target.value)}>
                                <option value="">Todas las licencias</option>
                                <option value="true">Licencia vigente</option>
                                <option value="false">Licencia vencida</option>
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="text-secondary py-4">
                            <span className="spinner-border spinner-border-sm me-2" />Cargando transportistas...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Cédula</th>
                                        <th>Nombre</th>
                                        <th>Teléfono</th>
                                        <th>Placa</th>
                                        <th>Licencia</th>
                                        <th>Estado</th>
                                        {puedeEscribir && <th className="text-end">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {transportistas.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-secondary py-4">
                                                No hay transportistas para mostrar.
                                            </td>
                                        </tr>
                                    ) : transportistas.map(t => (
                                        <tr key={t.id}>
                                            <td className="text-secondary">{t.cedula}</td>
                                            <td className="fw-semibold">{t.nombre}</td>
                                            <td>{t.telefono}</td>
                                            <td>{t.placa_cabezal}</td>
                                            <td>
                                                <span className={`badge ${t.licencia_vigente ? 'text-bg-success' : 'text-bg-danger'}`}>
                                                    {t.licencia_vigente ? 'Vigente' : 'Vencida'}
                                                </span>
                                                <div className="small text-secondary">{t.numero_licencia} · vence {fecha(t.vencimiento_licencia)}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${t.activo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                    {t.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            {puedeEscribir && (
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-outline-primary btn-sm me-2"
                                                        onClick={() => {
                                                            setEditando(t);
                                                            setErroresCampo({});
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}>
                                                        <i className="bi bi-pencil me-1" />Editar
                                                    </button>
                                                    {esAdmin && (
                                                        <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(t)}>
                                                            <i className="bi bi-trash me-1" />Eliminar
                                                        </button>
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
