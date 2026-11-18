import { useEffect, useState } from 'react';

const initial = {
    cedula: '', nombre: '', telefono: '', numero_licencia: '',
    vencimiento_licencia: '', placa_cabezal: '', activo: true
};

// Qué hace: Formulario para registrar o editar un transportista (chofer de cabezal).
// Qué usa: useState (formulario controlado) y useEffect para precargar los datos al editar.
// Cómo lo hace: Igual que el formulario de clientes: se precargan los valores, se revisan los
//     campos obligatorios y formatos, se llama a onSave y se marcan los errores de Django.
export default function FormTransportista({ transportista, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(transportista ? {
            cedula: transportista.cedula ?? '',
            nombre: transportista.nombre ?? '',
            telefono: transportista.telefono ?? '',
            numero_licencia: transportista.numero_licencia ?? '',
            vencimiento_licencia: transportista.vencimiento_licencia ?? '',
            placa_cabezal: transportista.placa_cabezal ?? '',
            activo: transportista.activo ?? true,
        } : { ...initial });
        setValidate('');
    }, [transportista]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: name === 'activo' ? value === 'true' : value }));
    };

    const clase = (campo) => `form-control ${errores[campo] ? 'is-invalid' : ''}`;

    const enviar = async (evento) => {
        evento.preventDefault();
        const obligatorios = ['cedula', 'nombre', 'telefono', 'numero_licencia', 'vencimiento_licencia', 'placa_cabezal'];
        if (obligatorios.some(campo => !String(form[campo]).trim())) {
            setValidate('Complete los campos obligatorios.');
            return;
        }
        if (!/^\d-\d{4}-\d{4}$/.test(form.cedula.trim())) {
            setValidate('La cédula debe tener el formato 1-1234-5678.');
            return;
        }
        if (!/^\d{4}-\d{4}$/.test(form.telefono.trim())) {
            setValidate('El teléfono debe tener el formato 8888-9999.');
            return;
        }
        setValidate('');
        const correct = await onSave({
            cedula: form.cedula.trim(),
            nombre: form.nombre.trim(),
            telefono: form.telefono.trim(),
            numero_licencia: form.numero_licencia.trim(),
            vencimiento_licencia: form.vencimiento_licencia,
            placa_cabezal: form.placa_cabezal.trim().toUpperCase(),
            activo: form.activo,
        });
        if (correct && !transportista)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {transportista ? `Editar transportista #${transportista.id}` : 'Registrar transportista'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="cedula">Cédula *</label>
                            <input id="cedula" name="cedula" className={clase('cedula')} value={form.cedula}
                                onChange={change} maxLength="11" placeholder="1-1234-5678" required />
                            <div className="invalid-feedback">{errores.cedula}</div>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="nombre">Nombre *</label>
                            <input id="nombre" name="nombre" className={clase('nombre')} value={form.nombre}
                                onChange={change} maxLength="150" required />
                            <div className="invalid-feedback">{errores.nombre}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="telefono">Teléfono *</label>
                            <input type="tel" id="telefono" name="telefono" className={clase('telefono')} value={form.telefono}
                                onChange={change} maxLength="9" placeholder="8888-9999" required />
                            <div className="invalid-feedback">{errores.telefono}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="numero_licencia">Número de licencia *</label>
                            <input id="numero_licencia" name="numero_licencia" className={clase('numero_licencia')}
                                value={form.numero_licencia} onChange={change} maxLength="20" required />
                            <div className="invalid-feedback">{errores.numero_licencia}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="vencimiento_licencia">Vencimiento de licencia *</label>
                            <input type="date" id="vencimiento_licencia" name="vencimiento_licencia"
                                className={clase('vencimiento_licencia')} value={form.vencimiento_licencia}
                                onChange={change} required />
                            <div className="invalid-feedback">{errores.vencimiento_licencia}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="placa_cabezal">Placa del cabezal *</label>
                            <input id="placa_cabezal" name="placa_cabezal" className={clase('placa_cabezal')}
                                value={form.placa_cabezal} onChange={change} maxLength="8" placeholder="C-123456" required />
                            <div className="invalid-feedback">{errores.placa_cabezal}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="activo">Estado *</label>
                            <select id="activo" name="activo" className="form-select"
                                value={String(form.activo)} onChange={change}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : transportista ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {transportista && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
