import { useEffect, useState } from 'react';

const initial = {
    numero_contenedor: '', cliente: '', descripcion: '', tipo: 'SECA',
    peso_kg: '', buque: '', fecha_arribo: ''
};

// Fecha de hoy (aaaa-mm-dd) para no permitir fechas de arribo futuras.
const hoy = () => new Date().toLocaleDateString('en-CA');

// Qué hace: Formulario para registrar o editar una carga (contenedor).
// Qué usa: useState y useEffect. Recibe la lista de clientes para el selector de la relación
//     carga → cliente.
// Cómo lo hace: El selector muestra los clientes que vienen de la API; los inactivos aparecen
//     deshabilitados porque Django no permite registrarles cargas. Se valida el formato del
//     contenedor, el peso y la fecha antes de enviar.
export default function FormCarga({ carga, clientes, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(carga ? {
            numero_contenedor: carga.numero_contenedor ?? '',
            cliente: String(carga.cliente ?? ''),
            descripcion: carga.descripcion ?? '',
            tipo: carga.tipo ?? 'SECA',
            peso_kg: carga.peso_kg ?? '',
            buque: carga.buque ?? '',
            fecha_arribo: carga.fecha_arribo ?? '',
        } : { ...initial });
        setValidate('');
    }, [carga]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: value }));
    };

    const clase = (campo, base = 'form-control') => `${base} ${errores[campo] ? 'is-invalid' : ''}`;

    const enviar = async (evento) => {
        evento.preventDefault();
        const obligatorios = ['numero_contenedor', 'cliente', 'descripcion', 'peso_kg', 'buque', 'fecha_arribo'];
        if (obligatorios.some(campo => !String(form[campo]).trim())) {
            setValidate('Complete los campos obligatorios.');
            return;
        }
        const contenedor = form.numero_contenedor.trim().toUpperCase();
        if (!/^[A-Z]{4}\d{7}$/.test(contenedor)) {
            setValidate('El contenedor debe tener 4 letras y 7 dígitos (ej. MSCU1234567).');
            return;
        }
        if (Number(form.peso_kg) <= 0) {
            setValidate('El peso debe ser mayor que 0 kg.');
            return;
        }
        setValidate('');
        const correct = await onSave({
            numero_contenedor: contenedor,
            cliente: Number(form.cliente),
            descripcion: form.descripcion.trim(),
            tipo: form.tipo,
            peso_kg: form.peso_kg,
            buque: form.buque.trim(),
            fecha_arribo: form.fecha_arribo,
        });
        if (correct && !carga)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {carga ? `Editar carga ${carga.numero_contenedor}` : 'Registrar carga'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="numero_contenedor">Número de contenedor *</label>
                            <input id="numero_contenedor" name="numero_contenedor" className={clase('numero_contenedor')}
                                value={form.numero_contenedor} onChange={change} maxLength="11"
                                placeholder="MSCU1234567" required />
                            <div className="invalid-feedback">{errores.numero_contenedor}</div>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="cliente">Cliente *</label>
                            <select id="cliente" name="cliente" className={clase('cliente', 'form-select')}
                                value={form.cliente} onChange={change} required>
                                <option value="">Seleccione un cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id} disabled={!c.activo}>
                                        {c.nombre} ({c.cedula_juridica}){c.activo ? '' : ' - inactivo'}
                                    </option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{errores.cliente}</div>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="descripcion">Descripción *</label>
                            <input id="descripcion" name="descripcion" className={clase('descripcion')}
                                value={form.descripcion} onChange={change} maxLength="200" required />
                            <div className="invalid-feedback">{errores.descripcion}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="tipo">Tipo de carga *</label>
                            <select id="tipo" name="tipo" className={clase('tipo', 'form-select')}
                                value={form.tipo} onChange={change}>
                                <option value="SECA">Carga seca</option>
                                <option value="REFRIGERADA">Carga refrigerada</option>
                                <option value="PELIGROSA">Mercancía peligrosa</option>
                            </select>
                            <div className="invalid-feedback">{errores.tipo}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="peso_kg">Peso (kg) *</label>
                            <input type="number" id="peso_kg" name="peso_kg" className={clase('peso_kg')}
                                value={form.peso_kg} onChange={change} min="0.01" max="30480" step="0.01" required />
                            <div className="invalid-feedback">{errores.peso_kg}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="buque">Buque *</label>
                            <input id="buque" name="buque" className={clase('buque')}
                                value={form.buque} onChange={change} maxLength="100" required />
                            <div className="invalid-feedback">{errores.buque}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="fecha_arribo">Fecha de arribo *</label>
                            <input type="date" id="fecha_arribo" name="fecha_arribo" className={clase('fecha_arribo')}
                                value={form.fecha_arribo} onChange={change} max={hoy()} required />
                            <div className="invalid-feedback">{errores.fecha_arribo}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : carga ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {carga && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
