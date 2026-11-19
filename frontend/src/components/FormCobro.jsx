import { useEffect, useState } from 'react';

const initial = { tramite: '', concepto: '', monto: '' };

// Qué hace: Formulario para registrar o editar un cobro de un trámite.
// Qué usa: useState y useEffect. Recibe la lista de trámites para el selector de la relación
//     cobro → trámite.
// Cómo lo hace: Al registrar solo se ofrecen trámites abiertos (no liberados ni cancelados). Al
//     editar, el trámite queda fijo porque Django no permite trasladar un cobro a otro trámite.
//     El número de factura y el estado los asigna el backend.
export default function FormCobro({ cobro, tramites, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(cobro ? {
            tramite: String(cobro.tramite ?? ''),
            concepto: cobro.concepto ?? '',
            monto: cobro.monto ?? '',
        } : { ...initial });
        setValidate('');
    }, [cobro]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: value }));
    };

    const clase = (campo, base = 'form-select') => `${base} ${errores[campo] ? 'is-invalid' : ''}`;

    const enviar = async (evento) => {
        evento.preventDefault();
        if (!form.tramite || !form.concepto || !String(form.monto).trim()) {
            setValidate('Complete los campos obligatorios.');
            return;
        }
        if (Number(form.monto) <= 0) {
            setValidate('El monto debe ser mayor que 0.');
            return;
        }
        setValidate('');
        const correct = await onSave({
            tramite: Number(form.tramite),
            concepto: form.concepto,
            monto: form.monto,
        });
        if (correct && !cobro)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {cobro ? `Editar cobro ${cobro.numero_factura}` : 'Registrar cobro'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label" htmlFor="tramite">Trámite *</label>
                            <select id="tramite" name="tramite" className={clase('tramite')} value={form.tramite}
                                onChange={change} disabled={Boolean(cobro)} required>
                                <option value="">Seleccione un trámite...</option>
                                {cobro && <option value={cobro.tramite}>{cobro.tramite_codigo} - {cobro.cliente_nombre}</option>}
                                {!cobro && tramites.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.codigo} - {t.contenedor} ({t.estado})
                                    </option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{errores.tramite}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="concepto">Concepto *</label>
                            <select id="concepto" name="concepto" className={clase('concepto')}
                                value={form.concepto} onChange={change} required>
                                <option value="">Seleccione...</option>
                                <option value="ALMACENAJE">Almacenaje en puerto</option>
                                <option value="DESALMACENAJE">Desalmacenaje</option>
                                <option value="TRANSPORTE">Transporte terrestre</option>
                                <option value="HONORARIOS">Honorarios de agencia</option>
                                <option value="IMPUESTOS">Impuestos de importación</option>
                            </select>
                            <div className="invalid-feedback">{errores.concepto}</div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="monto">Monto (₡) *</label>
                            <input type="number" id="monto" name="monto" className={clase('monto', 'form-control')}
                                value={form.monto} onChange={change} min="0.01" step="0.01" required />
                            <div className="invalid-feedback">{errores.monto}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : cobro ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {cobro && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
