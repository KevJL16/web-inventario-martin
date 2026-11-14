import React, { useState } from 'react';
import { AlertTriangle, Sliders } from 'lucide-react';
import { AdjustmentModel } from '../../models/AdjustmentModel';
import { MOTIVOS_PREDEFINIDOS, TIPOS_AJUSTE, crearFormularioInicial } from './ajustesConfig';

const campoClases = 'w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none';
const etiquetaClases = 'block text-xs font-bold text-slate-700 mb-1';

/**
 * Acta de ajuste o merma (HU-004). Valida en el navegador con las mismas reglas
 * que la API y delega el registro en onRegister, que devuelve { success, message }.
 */
export const AjusteFormModal = ({ products, onRegister, onClose }) => {
  const [form, setForm] = useState(() => crearFormularioInicial(products));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedProd = products.find((p) => p.id === Number(form.productoId));
  const actualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const validation = AdjustmentModel.validate({
      producto: selectedProd,
      tipoAjuste: form.tipoAjuste,
      cantidad: form.cantidadAjuste,
      motivo: form.motivo,
      detalle: form.detalle
    });
    if (!validation.isValid) {
      setFormError(validation.errors.join(' '));
      return;
    }

    setSubmitting(true);
    const res = await onRegister({
      productoId: form.productoId,
      tipoAjuste: form.tipoAjuste,
      cantidadAjuste: Number(form.cantidadAjuste),
      motivo: form.motivo,
      detalle: form.detalle.trim()
    });
    setSubmitting(false);

    if (!res.success) setFormError(res.message);
  };

  const impactoEstimado = selectedProd
    ? (Number(form.cantidadAjuste || 0) * selectedProd.costoCompra).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="ajuste-titulo" className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-martin-orange-500 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="ajuste-titulo" className="text-base font-bold">Acta de Ajuste de Stock y Merma</h2>
              <p className="text-xs text-slate-400">Descuento o corrección obligatoriamente auditada</p>
            </div>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {formError && (
            <div
              data-testid="ajuste-error"
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="ajuste-producto" className={etiquetaClases}>Producto Afectado *</label>
            <select
              id="ajuste-producto"
              data-testid="ajuste-producto"
              value={form.productoId}
              onChange={actualizar('productoId')}
              className={`${campoClases} font-semibold bg-white`}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.nombre} (Stock actual: {p.stockActual})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ajuste-tipo" className={etiquetaClases}>Naturaleza del Ajuste *</label>
              <select
                id="ajuste-tipo"
                data-testid="ajuste-tipo"
                value={form.tipoAjuste}
                onChange={actualizar('tipoAjuste')}
                className={`${campoClases} font-semibold bg-white`}
              >
                {TIPOS_AJUSTE.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ajuste-cantidad" className={etiquetaClases}>Cantidad a Ajustar *</label>
              <input
                id="ajuste-cantidad"
                type="number"
                min="1"
                required
                data-testid="ajuste-cantidad"
                value={form.cantidadAjuste}
                onChange={actualizar('cantidadAjuste')}
                className={`${campoClases} font-bold`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ajuste-motivo" className={etiquetaClases}>Motivo Frecuente</label>
            <select
              id="ajuste-motivo"
              data-testid="ajuste-motivo"
              value={form.motivo}
              onChange={actualizar('motivo')}
              className={`${campoClases} font-semibold bg-white`}
            >
              {MOTIVOS_PREDEFINIDOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ajuste-detalle" className={etiquetaClases}>
              Justificación Técnica Detallada *
            </label>
            <textarea
              id="ajuste-detalle"
              rows={3}
              data-testid="ajuste-detalle"
              value={form.detalle}
              onChange={actualizar('detalle')}
              placeholder="Detalle exactamente cómo ocurrió el daño, ubicación o discrepancia encontrada..."
              className={campoClases}
            />
          </div>

          {selectedProd && (
            <div className="p-3 bg-martin-orange-50/70 border border-martin-orange-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Stock Actual:</span>
                <span className="font-bold">{selectedProd.stockActual} unidades</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Impacto Económico Estimado:</span>
                <span className="font-bold text-martin-orange-700">S/ {impactoEstimado}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="btn-asentar-ajuste"
              className="px-5 py-2 text-xs font-bold text-white bg-martin-orange-700 hover:bg-martin-orange-800 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? 'Registrando...' : 'Asentar Ajuste en Inventario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
