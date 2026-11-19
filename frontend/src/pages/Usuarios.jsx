import { useCallback, useEffect, useState } from 'react';
import { getError, getErroresCampo } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FormUsuario from '../components/FormUsuario.jsx';
import { actualizarUsuario, crearUsuario, eliminarUsuario, listarUsuarios } from '../services/usuarioService.js';

// Qué hace: Pantalla para administrar los usuarios y sus roles.
// Qué usa: useState, useEffect, useCallback, el servicio de usuarios, FormUsuario y useAuth.
// Cómo lo hace: Siempre se consulta a Django (GET /api/auth/usuarios/). Si el rol no es
//     Administrador, Django responde 403 y se muestra el mensaje de acceso denegado. Así se
//     comprueba que la seguridad la hace el backend y no el ocultamiento de botones.
export default function Usuarios() {
    const { username } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [denegado, setDenegado] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(null);
    const [erroresCampo, setErroresCampo] = useState({});

    // Qué hace: Se consulta la lista de usuarios.
    // Qué usa: listarUsuarios (GET /api/auth/usuarios/).
    // Cómo lo hace: Si la respuesta es 403 se guarda en "denegado" para mostrar la pantalla de
    //     acceso denegado; cualquier otro error se muestra como alerta.
    const recargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            setUsuarios(await listarUsuarios());
        } catch (e) {
            if (e.response?.status === 403)
                setDenegado(getError(e));
            else
                setError(getError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        recargar();
    }, [recargar]);

    // Qué hace: Se crea o actualiza un usuario.
    // Qué usa: crearUsuario (POST) o actualizarUsuario (PATCH).
    // Cómo lo hace: Según haya uno en edición; los errores 400 se marcan en el formulario.
    const guardar = async (datos) => {
        setGuardando(true);
        setError('');
        setExito('');
        setErroresCampo({});
        try {
            if (editando) {
                await actualizarUsuario(editando.id, datos);
                setEditando(null);
                setExito('Usuario actualizado correctamente.');
            } else {
                await crearUsuario(datos);
                setExito('Usuario registrado correctamente.');
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

    // Qué hace: Se elimina un usuario después de confirmar.
    // Qué usa: eliminarUsuario (DELETE).
    // Cómo lo hace: Se llama a Django y se recarga la lista.
    const eliminar = async (usuario) => {
        if (!window.confirm(`¿Eliminar el usuario "${usuario.username}"?`))
            return;
        setError('');
        setExito('');
        try {
            await eliminarUsuario(usuario.id);
            setExito('Usuario eliminado correctamente.');
            await recargar();
        } catch (e) {
            setError(getError(e));
        }
    };

    return (
        <>
            <div className="mb-4">
                <p className="eyebrow mb-1">SEGURIDAD / USUARIOS</p>
                <h1 className="h2 fw-bold mb-1">Usuarios</h1>
                <p className="text-secondary mb-0">Cuentas de acceso y rol de cada persona (solo Administrador).</p>
            </div>

            {denegado ? (
                <section className="card border-0 shadow-sm">
                    <div className="card-body p-5 text-center">
                        <div className="stat-icon red mx-auto mb-3"><i className="bi bi-shield-lock" /></div>
                        <h2 className="h4 fw-bold">Acceso denegado</h2>
                        <p className="text-secondary mb-0">{denegado}</p>
                    </div>
                </section>
            ) : (
                <>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {exito && <div className="alert alert-success" role="status">{exito}</div>}

                    <FormUsuario
                        usuario={editando}
                        onSave={guardar}
                        onCancel={() => { setEditando(null); setErroresCampo({}); }}
                        saving={guardando}
                        errores={erroresCampo}
                    />

                    <section className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="h5 mb-3 fw-bold">Listado ({usuarios.length})</h2>
                            {cargando ? (
                                <div className="text-secondary py-4">
                                    <span className="spinner-border spinner-border-sm me-2" />Cargando usuarios...
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Usuario</th>
                                                <th>Nombre</th>
                                                <th>Correo</th>
                                                <th>Rol</th>
                                                <th>Estado</th>
                                                <th className="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usuarios.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center text-secondary py-4">No hay usuarios.</td>
                                                </tr>
                                            ) : usuarios.map(u => (
                                                <tr key={u.id}>
                                                    <td className="fw-semibold">{u.username}</td>
                                                    <td>{`${u.first_name} ${u.last_name}`.trim() || '—'}</td>
                                                    <td>{u.email || '—'}</td>
                                                    <td><span className="badge text-bg-light border">{u.rol || 'Sin rol'}</span></td>
                                                    <td>
                                                        <span className={`badge ${u.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                            {u.is_active ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end text-nowrap">
                                                        <button className="btn btn-outline-primary btn-sm me-2"
                                                            onClick={() => {
                                                                setEditando(u);
                                                                setErroresCampo({});
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}>
                                                            <i className="bi bi-pencil me-1" />Editar
                                                        </button>
                                                        {u.username !== username && (
                                                            <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(u)}>
                                                                <i className="bi bi-trash me-1" />Eliminar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </>
    );
}
