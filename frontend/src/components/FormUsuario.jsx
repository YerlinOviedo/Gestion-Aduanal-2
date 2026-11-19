import { useEffect, useState } from 'react';

const initial = { username: '', first_name: '', last_name: '', email: '', rol: 'Consulta', password: '', is_active: true };

// Qué hace: Formulario para crear o editar un usuario del sistema y asignarle un rol.
// Qué usa: useState y useEffect (formulario controlado y precarga al editar).
// Cómo lo hace: Al crear, la contraseña es obligatoria; al editar se puede dejar vacía y no se
//     envía, así se conserva la actual. Django valida la seguridad de la contraseña.
export default function FormUsuario({ usuario, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(usuario ? {
            username: usuario.username ?? '',
            first_name: usuario.first_name ?? '',
            last_name: usuario.last_name ?? '',
            email: usuario.email ?? '',
            rol: usuario.rol ?? 'Consulta',
            password: '',
            is_active: usuario.is_active ?? true,
        } : { ...initial });
        setValidate('');
    }, [usuario]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: name === 'is_active' ? value === 'true' : value }));
    };

    const clase = (campo, base = 'form-control') => `${base} ${errores[campo] ? 'is-invalid' : ''}`;

    const enviar = async (evento) => {
        evento.preventDefault();
        if (!form.username.trim() || (!usuario && !form.password)) {
            setValidate(usuario ? 'El usuario es obligatorio.' : 'El usuario y la contraseña son obligatorios.');
            return;
        }
        setValidate('');
        const datos = {
            username: form.username.trim(),
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            rol: form.rol,
            is_active: form.is_active,
        };
        if (form.password)
            datos.password = form.password;
        const correct = await onSave(datos);
        if (correct && !usuario)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {usuario ? `Editar usuario ${usuario.username}` : 'Registrar usuario'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="username">Usuario *</label>
                            <input id="username" name="username" className={clase('username')} value={form.username}
                                onChange={change} maxLength="150" autoComplete="off" required />
                            <div className="invalid-feedback">{errores.username}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="first_name">Nombre</label>
                            <input id="first_name" name="first_name" className={clase('first_name')}
                                value={form.first_name} onChange={change} maxLength="150" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="last_name">Apellidos</label>
                            <input id="last_name" name="last_name" className={clase('last_name')}
                                value={form.last_name} onChange={change} maxLength="150" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="email">Correo</label>
                            <input type="email" id="email" name="email" className={clase('email')}
                                value={form.email} onChange={change} />
                            <div className="invalid-feedback">{errores.email}</div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="rol">Rol *</label>
                            <select id="rol" name="rol" className={clase('rol', 'form-select')} value={form.rol} onChange={change}>
                                <option value="Administrador">Administrador</option>
                                <option value="Operador">Operador</option>
                                <option value="Consulta">Consulta</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="password">
                                Contraseña {usuario ? '(opcional)' : '*'}
                            </label>
                            <input type="password" id="password" name="password" className={clase('password')}
                                value={form.password} onChange={change} autoComplete="new-password" />
                            <div className="invalid-feedback">{errores.password}</div>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label" htmlFor="is_active">Estado</label>
                            <select id="is_active" name="is_active" className="form-select"
                                value={String(form.is_active)} onChange={change}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : usuario ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {usuario && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
