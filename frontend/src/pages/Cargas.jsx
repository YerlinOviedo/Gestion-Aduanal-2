import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FormCarga from '../components/FormCarga.jsx';
import Paginacion from '../components/Paginacion.jsx';
import { actualizarCarga, crearCarga, eliminarCarga, listarCargas } from '../services/cargaService.js';
import { listarTodosClientes } from '../services/clienteService.js';
import { fecha } from '../utils/formato.js';

const TIPOS = { SECA: 'Seca', REFRIGERADA: 'Refrigerada', PELIGROSA: 'Peligrosa' };

// Qué hace: Pantalla del módulo de cargas: listado, filtros combinables, búsqueda, ordenamiento,
//     paginación y CRUD. Muestra la relación carga → cliente.
// Qué usa: useState, useEffect, useCallback, los servicios de cargas y clientes, FormCarga,
//     Paginacion y useAuth.
// Cómo lo hace: Al abrir se cargan los clientes para los selectores. El listado se pide a Django
//     con todos los filtros juntos (GET /api/cargas/?cliente=&tipo=&buscar=&ordenar=&page=).
export default function Cargas() {
    const { puedeEscribir, esAdmin } = useAuth();
    const [cargas, setCargas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [paginacion, setPaginacion] = useState({ total_paginas: 1, total_registros: 0 });
    const [pagina, setPagina] = useState(1);
    const [filtros, setFiltros] = useState({ cliente: '', tipo: '', buscar: '', ordenar: '-fecha_arribo' });
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Se consultan todos los clientes una sola vez para el formulario y el filtro.
    useEffect(() => {
        listarTodosClientes()
            .then(setClientes)
            .catch(e => setError(getError(e)));
    }, []);

    // Qué hace: Se consulta la página actual de cargas con los filtros y el orden elegidos.
    // Qué usa: listarCargas (GET /api/cargas/).
    // Cómo lo hace: Se piden los datos a Django y se guardan los resultados y la paginación.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const data = await listarCargas({ ...filtros, page: pagina });
            setCargas(data.resultados);
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

    // Qué hace: Se registra o actualiza una carga.
    // Qué usa: crearCarga (POST) o actualizarCarga (PUT).
    // Cómo lo hace: Según haya una en edición; los errores 400 (por ejemplo, fecha futura o
    //     cliente inactivo) se marcan en el formulario.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                await actualizarCarga(editando.id, datos);
                setEditando(null);
                setExito('Carga actualizada correctamente.');
            } else {
                await crearCarga(datos);
                setExito('Carga registrada correctamente.');
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

    // Qué hace: Se elimina una carga después de confirmar.
    // Qué usa: eliminarCarga (DELETE).
    // Cómo lo hace: Si la carga tiene trámites, Django responde 409 y se muestra el mensaje.
    const eliminar = async (carga) => {
        if (!window.confirm(`¿Eliminar la carga ${carga.numero_contenedor}?`))
            return;
        setError('');
        setExito('');
        try {
            await eliminarCarga(carga.id);
            if (editando?.id === carga.id)
                setEditando(null);
            setExito('Carga eliminada correctamente.');
            await recargar();
        } catch (e) {
            setError(getError(e));
        }
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">MÓDULOS / CARGAS</p>
                <h1 className="h2 fw-bold mb-1">Cargas</h1>
                <p className="text-secondary mb-0">
                    Contenedores que llegan a Puerto Caldera a nombre de cada cliente.
                </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            {puedeEscribir ? (
                <FormCarga
                    carga={editando}
                    clientes={clientes}
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
                            <input className="form-control" aria-label="Buscar cargas"
                                placeholder="Contenedor, descripción o cliente..."
                                value={texto} onChange={e => setTexto(e.target.value)} />
                            <button type="submit" className="btn btn-primary"><i className="bi bi-search" /></button>
                        </form>
                        <div className="col-sm-6 col-lg-3">
                            <select className="form-select" aria-label="Filtrar por cliente"
                                value={filtros.cliente} onChange={e => cambiarFiltro('cliente', e.target.value)}>
                                <option value="">Todos los clientes</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="col-sm-6 col-lg-2">
                            <select className="form-select" aria-label="Filtrar por tipo"
                                value={filtros.tipo} onChange={e => cambiarFiltro('tipo', e.target.value)}>
                                <option value="">Todos los tipos</option>
                                <option value="SECA">Seca</option>
                                <option value="REFRIGERADA">Refrigerada</option>
                                <option value="PELIGROSA">Peligrosa</option>
                            </select>
                        </div>
                        <div className="col-lg-3">
                            <select className="form-select" aria-label="Ordenar cargas"
                                value={filtros.ordenar} onChange={e => cambiarFiltro('ordenar', e.target.value)}>
                                <option value="-fecha_arribo">Arribo: más recientes</option>
                                <option value="fecha_arribo">Arribo: más antiguas</option>
                                <option value="-peso_kg">Peso: mayor a menor</option>
                                <option value="peso_kg">Peso: menor a mayor</option>
                                <option value="numero_contenedor">Contenedor: A-Z</option>
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="text-secondary py-4">
                            <span className="spinner-border spinner-border-sm me-2" />Cargando cargas...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Contenedor</th>
                                        <th>Cliente</th>
                                        <th>Descripción</th>
                                        <th>Tipo</th>
                                        <th className="text-end">Peso (kg)</th>
                                        <th>Buque</th>
                                        <th>Arribo</th>
                                        {puedeEscribir && <th className="text-end">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargas.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-secondary py-4">
                                                No hay cargas para mostrar.
                                            </td>
                                        </tr>
                                    ) : cargas.map(c => (
                                        <tr key={c.id}>
                                            <td className="fw-semibold">{c.numero_contenedor}</td>
                                            <td>{c.cliente_nombre}</td>
                                            <td>{c.descripcion}</td>
                                            <td>
                                                <span className={`badge ${c.tipo === 'PELIGROSA' ? 'text-bg-danger' : c.tipo === 'REFRIGERADA' ? 'text-bg-info' : 'text-bg-light border'}`}>
                                                    {TIPOS[c.tipo]}
                                                </span>
                                            </td>
                                            <td className="text-end">{Number(c.peso_kg).toLocaleString('es-CR')}</td>
                                            <td>{c.buque}</td>
                                            <td>{fecha(c.fecha_arribo)}</td>
                                            {puedeEscribir && (
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-outline-primary btn-sm me-2"
                                                        onClick={() => {
                                                            setEditando(c);
                                                            setErroresCampo({});
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}>
                                                        <i className="bi bi-pencil me-1" />Editar
                                                    </button>
                                                    {esAdmin && (
                                                        <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(c)}>
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
