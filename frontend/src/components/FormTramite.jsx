import { useEffect, useState } from 'react';

const initial = { carga: '', transportista: '', tipo: 'IMPORTACION', observaciones: '' };

// Qué hace: Formulario para registrar o editar un trámite aduanero.
// Qué usa: useState y useEffect. Recibe las listas de cargas y transportistas para los
//     selectores de las relaciones trámite → carga y trámite → transportista.
// Cómo lo hace: Los transportistas inactivos o con licencia vencida aparecen deshabilitados.
//     La carga solo se puede cambiar mientras el trámite está REGISTRADO (regla del backend).
//     El código, el estado y los permisos los asigna Django automáticamente.
export default function FormTramite({ tramite, cargas, transportistas, onSave, onCancel, saving, errores = {} }) {
    const [form, setForm] = useState(initial);
    const [validate, setValidate] = useState('');

    useEffect(() => {
        setForm(tramite ? {
            carga: String(tramite.carga ?? ''),
            transportista: tramite.transportista ? String(tramite.transportista) : '',
            tipo: tramite.tipo ?? 'IMPORTACION',
            observaciones: tramite.observaciones ?? '',
        } : { ...initial });
        setValidate('');
    }, [tramite]);

    const change = (evento) => {
        const { name, value } = evento.target;
        setForm(actual => ({ ...actual, [name]: value }));
    };

    const clase = (campo, base = 'form-select') => `${base} ${errores[campo] ? 'is-invalid' : ''}`;
    const cargaBloqueada = Boolean(tramite) && tramite.estado !== 'REGISTRADO';

    const enviar = async (evento) => {
        evento.preventDefault();
        if (!form.carga) {
            setValidate('Seleccione la carga del trámite.');
            return;
        }
        setValidate('');
        const correct = await onSave({
            carga: Number(form.carga),
            transportista: form.transportista ? Number(form.transportista) : null,
            tipo: form.tipo,
            observaciones: form.observaciones.trim(),
        });
        if (correct && !tramite)
            setForm({ ...initial });
    };

    return (
        <section className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h2 className="h5 fw-bold mb-3">
                    {tramite ? `Editar trámite ${tramite.codigo}` : 'Registrar trámite'}
                </h2>
                {validate && <div role="alert" className="alert alert-warning">{validate}</div>}
                <form onSubmit={enviar} noValidate>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="carga">Carga (contenedor) *</label>
                            <select id="carga" name="carga" className={clase('carga')} value={form.carga}
                                onChange={change} disabled={cargaBloqueada} required>
                                <option value="">Seleccione una carga...</option>
                                {cargas.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.numero_contenedor} - {c.cliente_nombre}
                                    </option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{errores.carga}</div>
                            {cargaBloqueada && <div className="form-text">La carga solo se cambia en estado REGISTRADO.</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="transportista">Transportista</label>
                            <select id="transportista" name="transportista" className={clase('transportista')}
                                value={form.transportista} onChange={change}>
                                <option value="">Sin asignar</option>
                                {transportistas.map(t => (
                                    <option key={t.id} value={t.id} disabled={!t.activo || !t.licencia_vigente}>
                                        {t.nombre} ({t.placa_cabezal})
                                        {!t.activo ? ' - inactivo' : !t.licencia_vigente ? ' - licencia vencida' : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{errores.transportista}</div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" htmlFor="tipo">Tipo de trámite *</label>
                            <select id="tipo" name="tipo" className={clase('tipo')} value={form.tipo} onChange={change}>
                                <option value="IMPORTACION">Importación</option>
                                <option value="EXPORTACION">Exportación</option>
                                <option value="TRANSITO">Tránsito</option>
                            </select>
                            <div className="invalid-feedback">{errores.tipo}</div>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="observaciones">Observaciones</label>
                            <textarea id="observaciones" name="observaciones" rows="1"
                                className={clase('observaciones', 'form-control')}
                                value={form.observaciones} onChange={change} />
                            <div className="invalid-feedback">{errores.observaciones}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <i className="bi bi-save me-2" />
                            {saving ? 'Guardando...' : tramite ? 'Guardar cambios' : 'Registrar'}
                        </button>
                        {tramite && <button type="button" className="btn btn-outline-secondary"
                            onClick={onCancel} disabled={saving}>Cancelar</button>}
                    </div>
                </form>
            </div>
        </section>
    );
}
