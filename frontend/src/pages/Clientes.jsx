import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FormCliente from '../components/FormCliente.jsx';
import Paginacion from '../components/Paginacion.jsx';
import {
    actualizarCliente,
    crearCliente,
    eliminarCliente,
    listarClientes
} from '../services/clienteService.js';

// Qué hace: Pantalla del módulo de clientes: listado, filtros, búsqueda, paginación y CRUD.
// Qué usa: useState, useEffect y useCallback; el servicio de clientes; FormCliente y Paginacion;
//     useAuth para saber qué acciones mostrar según el rol.
// Cómo lo hace: Cada vez que cambian los filtros o la página se vuelve a consultar Django
//     (GET /api/clientes/?activo=&buscar=&page=), así los filtros los aplica el backend.
//     Después de guardar o eliminar se recarga el listado para ver los datos reales.
export default function Clientes() {
    const { puedeEscribir, esAdmin } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [paginacion, setPaginacion] = useState({ total_paginas: 1, total_registros: 0 });
    const [pagina, setPagina] = useState(1);
    const [filtros, setFiltros] = useState({ activo: '', buscar: '' });
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Qué hace: Se consulta la página actual de clientes con los filtros aplicados.
    // Qué usa: listarClientes (GET /api/clientes/).
    // Cómo lo hace: Se activa el estado de carga, se piden los datos y se guardan los resultados
    //     y la información de paginación. Si falla, se muestra el mensaje de error.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const data = await listarClientes({ ...filtros, page: pagina });
            setClientes(data.resultados);
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

    // Al cambiar un filtro se vuelve a la página 1.
    const cambiarFiltro = (nombre, valor) => {
        setFiltros(actual => ({ ...actual, [nombre]: valor }));
        setPagina(1);
    };

    const buscar = (evento) => {
        evento.preventDefault();
        cambiarFiltro('buscar', texto.trim());
    };

    // Qué hace: Se registra un cliente nuevo o se guardan los cambios del que se está editando.
    // Qué usa: crearCliente (POST) o actualizarCliente (PUT).
    // Cómo lo hace: Si hay un cliente en edición se actualiza; si no, se crea. Si Django responde
    //     400 se guardan los errores por campo para marcarlos en el formulario.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                await actualizarCliente(editando.id, datos);
                setEditando(null);
                setExito('Cliente actualizado correctamente.');
            } else {
                await crearCliente(datos);
                setExito('Cliente registrado correctamente.');
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

    // Qué hace: Se elimina un cliente después de confirmar.
    // Qué usa: window.confirm y eliminarCliente (DELETE).
    // Cómo lo hace: Si el usuario confirma se llama a Django; si el cliente tiene cargas, Django
    //     responde 409 y se muestra el mensaje.
    const eliminar = async (cliente) => {
        if (!window.confirm(`¿Eliminar el cliente "${cliente.nombre}"?`))
            return;
        setError('');
        setExito('');
        try {
            await eliminarCliente(cliente.id);
            if (editando?.id === cliente.id)
                setEditando(null);
            setExito('Cliente eliminado correctamente.');
            await recargar();
        } catch (e) {
            setError(getError(e));
        }
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">MÓDULOS / CLIENTES</p>
                <h1 className="h2 fw-bold mb-1">Clientes</h1>
                <p className="text-secondary mb-0">
                    Empresas importadoras y exportadoras que contratan los servicios de la agencia.
                </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            {puedeEscribir ? (
                <FormCliente
                    cliente={editando}
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
                        <form className="col-md-8 d-flex gap-2" onSubmit={buscar}>
                            <input className="form-control" aria-label="Buscar clientes"
                                placeholder="Buscar por nombre, cédula jurídica o correo..."
                                value={texto} onChange={e => setTexto(e.target.value)} />
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-search" />
                            </button>
                        </form>
                        <div className="col-md-4">
                            <select className="form-select" aria-label="Filtrar por estado"
                                value={filtros.activo} onChange={e => cambiarFiltro('activo', e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="text-secondary py-4">
                            <span className="spinner-border spinner-border-sm me-2" />Cargando clientes...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Cédula jurídica</th>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>Teléfono</th>
                                        <th className="text-center">Cargas</th>
                                        <th>Estado</th>
                                        {puedeEscribir && <th className="text-end">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-secondary py-4">
                                                No hay clientes para mostrar.
                                            </td>
                                        </tr>
                                    ) : clientes.map(c => (
                                        <tr key={c.id}>
                                            <td className="text-secondary">{c.cedula_juridica}</td>
                                            <td className="fw-semibold">{c.nombre}</td>
                                            <td>{c.correo}</td>
                                            <td>{c.telefono}</td>
                                            <td className="text-center">{c.cantidad_cargas}</td>
                                            <td>
                                                <span className={`badge ${c.activo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                    {c.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
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
