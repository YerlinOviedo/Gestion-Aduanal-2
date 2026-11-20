import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getError } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { listarClientes } from '../services/clienteService.js';
import {
    clientesConSaldo,
    ingresosDelMes,
    licenciasPorVencer,
    listosParaLiberar,
    tramitesPorEstado
} from '../services/reporteService.js';
import { colones, COLOR_ESTADO_TRAMITE } from '../utils/formato.js';

// Accesos directos a los cinco módulos de negocio.
const accesos = [
    { ruta: '/clientes', nombre: 'Clientes', icono: 'bi-building' },
    { ruta: '/transportistas', nombre: 'Transportistas', icono: 'bi-truck' },
    { ruta: '/cargas', nombre: 'Cargas', icono: 'bi-box' },
    { ruta: '/tramites', nombre: 'Trámites', icono: 'bi-file-earmark-text' },
    { ruta: '/cobros', nombre: 'Cobros', icono: 'bi-cash-coin' },
];

const ESTADOS_ACTIVOS = ['REGISTRADO', 'EN_REVISION', 'APROBADO'];

// Qué hace: Pantalla inicial con indicadores calculados con datos reales de la API.
// Qué usa: useEffect y useState, el servicio de clientes y los reportes de Django.
// Cómo lo hace: Al abrir la pantalla se hacen todas las consultas a la vez con Promise.all.
//     Con las respuestas se arman las tarjetas: clientes, trámites activos, ingresos del mes,
//     trámites listos para liberar, saldo pendiente y licencias por vencer.
export default function Dashboard() {
    const { username, rol } = useAuth();
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;
        Promise.all([
            listarClientes({ page: 1 }),
            tramitesPorEstado(),
            ingresosDelMes(),
            listosParaLiberar(),
            clientesConSaldo(),
            licenciasPorVencer(30),
        ])
            .then(([clientes, estados, ingresos, listos, saldos, licencias]) => {
                if (activo)
                    setDatos({ clientes, estados, ingresos, listos, saldos, licencias });
            })
            .catch(e => {
                if (activo) setError(getError(e));
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        // Si el usuario cambia de pantalla antes de que respondan, no se actualiza el estado.
        return () => {
            activo = false;
        };
    }, []);

    const tarjetas = datos ? [
        { titulo: 'Clientes registrados', valor: datos.clientes.total_registros, icono: 'bi-building', tono: 'blue' },
        {
            titulo: 'Trámites activos',
            valor: datos.estados.por_estado
                .filter(e => ESTADOS_ACTIVOS.includes(e.estado))
                .reduce((suma, e) => suma + e.cantidad, 0),
            icono: 'bi-file-earmark-text', tono: 'purple'
        },
        { titulo: 'Ingresos del mes', valor: colones(datos.ingresos.total), icono: 'bi-cash-stack', tono: 'green' },
        { titulo: 'Listos para liberar', valor: datos.listos.cantidad, icono: 'bi-check2-circle', tono: 'green' },
        {
            titulo: 'Saldo pendiente de clientes',
            valor: colones(datos.saldos.reduce((suma, c) => suma + Number(c.saldo_pendiente), 0)),
            icono: 'bi-hourglass-split', tono: 'orange'
        },
        { titulo: 'Licencias por vencer (30 días)', valor: datos.licencias.transportistas.length, icono: 'bi-person-vcard', tono: 'red' },
    ] : [];

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">PANEL GENERAL</p>
                <h1 className="h2 fw-bold mb-1">Dashboard</h1>
                <p className="text-secondary mb-0">
                    Bienvenido, {username} ({rol}). Resumen de la agencia aduanal en Puerto Caldera.
                </p>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
                {accesos.map(a => (
                    <Link key={a.ruta} to={a.ruta} className="btn btn-outline-primary">
                        <i className={`bi ${a.icono} me-2`} />{a.nombre}
                    </Link>
                ))}
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            {cargando ? (
                <div className="text-secondary py-4">
                    <span className="spinner-border spinner-border-sm me-2" />Cargando indicadores...
                </div>
            ) : datos && (
                <>
                    <div className="row g-3 mb-4">
                        {tarjetas.map(t => (
                            <div key={t.titulo} className="col-sm-6 col-xl-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body p-4 d-flex justify-content-between align-items-center gap-2">
                                        <div>
                                            <p className="text-secondary small mb-2">{t.titulo}</p>
                                            <h2 className="h3 mb-0 fw-bold">{t.valor}</h2>
                                        </div>
                                        <div className={`stat-icon ${t.tono}`}>
                                            <i className={`bi ${t.icono}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="row g-3">
                        <div className="col-lg-5">
                            <section className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <h2 className="h5 fw-bold mb-3">Trámites por estado</h2>
                                    {datos.estados.por_estado.length === 0 ? (
                                        <p className="text-secondary mb-0">Todavía no hay trámites.</p>
                                    ) : (
                                        <ul className="list-group list-group-flush">
                                            {datos.estados.por_estado.map(e => (
                                                <li key={e.estado} className="list-group-item d-flex justify-content-between px-0">
                                                    <span className={`badge ${COLOR_ESTADO_TRAMITE[e.estado]}`}>{e.estado}</span>
                                                    <span className="fw-semibold">{e.cantidad}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </section>
                        </div>
                        <div className="col-lg-7">
                            <section className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h2 className="h5 fw-bold mb-0">Clientes con saldo pendiente</h2>
                                        <Link to="/cobros" className="small text-decoration-none">Ver cobros</Link>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Cliente</th>
                                                    <th className="text-center">Trámites activos</th>
                                                    <th className="text-end">Saldo pendiente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {datos.saldos.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="text-center text-secondary py-4">
                                                            Ningún cliente tiene saldo pendiente.
                                                        </td>
                                                    </tr>
                                                ) : datos.saldos.slice(0, 5).map(c => (
                                                    <tr key={c.id}>
                                                        <td className="fw-medium">{c.nombre}</td>
                                                        <td className="text-center">{c.tramites_activos}</td>
                                                        <td className="text-end">{colones(c.saldo_pendiente)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
