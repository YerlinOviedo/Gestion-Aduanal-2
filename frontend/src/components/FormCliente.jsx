import { useEffect, useState } from 'react';

const initial = { cedula_juridica: '', nombre: '', correo: '', telefono: '', direccion: '', activo: true };

// Qué hace: Formulario para registrar o editar un cliente.
// Qué usa: useState para los campos (formulario controlado) y useEffect para precargar los datos
//     al editar. Recibe del módulo: cliente, onSave, onCancel, saving y errores.
// Cómo lo hace: Si llega un cliente se llenan los campos con sus valores; si no, quedan vacíos.
//     Antes de enviar se revisan los campos obligatorios y los formatos; luego se llama a onSave.
//     Los errores que devuelve Django (400) se muestran debajo de cada campo.
export default function FormCliente({ cliente, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(cliente ? {
            cedula_juridica: cliente.cedula_juridica ?? '',
            nombre: cliente.nombre ?? '',
            correo: cliente.correo ?? '',
            telefono: cliente.telefono ?? '',
            direccion: cliente.direccion ?? '',
            activo: cliente.activo ?? true,
        } : { ...initial });
        setValidate('');
    }, [cliente]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: name === 'activo' ? value === 'true' : value }));
    };

    // Clase de Bootstrap para marcar en rojo el campo que Django rechazó.
    const clase = (campo) => `form-control ${errores[campo] ? 'is-invalid' : ''}`;

    const enviar = async (evento) => {
        evento.preventDefault();
        if (!form.cedula_juridica.trim() || !form.nombre.trim() || !form.correo.trim() || !form.telefono.trim()) {
            setValidate('Complete los campos obligatorios.');
            return;
        }
        if (!/^\d-\d{3}-\d{6}$/.test(form.cedula_juridica.trim())) {
            setValidate('La cédula jurídica debe tener el formato 3-101-123456.');
            return;
        }
        if (!/^\d{4}-\d{4}$/.test(form.telefono.trim())) {
            setValidate('El teléfono debe tener el formato 2222-3333.');
            return;
        }
        setValidate('');
        const correct = await onSave({
            cedula_juridica: form.cedula_juridica.trim(),
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono.trim(),
            direccion: form.direccion.trim(),
            activo: form.activo,
        });
        if (correct && !cliente)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {cliente ? `Editar cliente #${cliente.id}` : 'Registrar cliente'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="cedula_juridica">Cédula jurídica *</label>
                            <input id="cedula_juridica" name="cedula_juridica" className={clase('cedula_juridica')}
                                value={form.cedula_juridica} onChange={change} maxLength="12"
                                placeholder="3-101-123456" required />
                            <div className="invalid-feedback">{errores.cedula_juridica}</div>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="nombre">Nombre *</label>
                            <input id="nombre" name="nombre" className={clase('nombre')}
                                value={form.nombre} onChange={change} maxLength="150" required />
                            <div className="invalid-feedback">{errores.nombre}</div>
                        </div>
                        <div className="col-md-5">
                            <label className="form-label" htmlFor="correo">Correo *</label>
                            <input type="email" id="correo" name="correo" className={clase('correo')}
                                value={form.correo} onChange={change} maxLength="254" required />
                            <div className="invalid-feedback">{errores.correo}</div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="telefono">Teléfono *</label>
                            <input type="tel" id="telefono" name="telefono" className={clase('telefono')}
                                value={form.telefono} onChange={change} maxLength="9"
                                placeholder="2222-3333" required />
                            <div className="invalid-feedback">{errores.telefono}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="activo">Estado *</label>
                            <select id="activo" name="activo" className={`form-select ${errores.activo ? 'is-invalid' : ''}`}
                                value={String(form.activo)} onChange={change}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                            <div className="invalid-feedback">{errores.activo}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label" htmlFor="direccion">Dirección</label>
                            <input id="direccion" name="direccion" className={clase('direccion')}
                                value={form.direccion} onChange={change} maxLength="255" />
                            <div className="invalid-feedback">{errores.direccion}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : cliente ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {cliente && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
