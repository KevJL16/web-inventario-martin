import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  Plus,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Search
} from 'lucide-react';

export const AjustesStockView = () => {
  const { products, adjustments, registerAdjustment } = useInventory();
  const { isGerencia } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    productoId: products.length > 0 ? String(products[0].id) : '',
    tipoAjuste: 'MERMA_DANO',
    cantidadAjuste: '1',
    motivo: 'Tablero desportillado en esquina por maniobra de estiba',
    detalle: ''
  });

  const motivosPredefinidos = [
    'Tablero desportillado en esquina por maniobra de estiba',
    'Rotura en tablero de melamina por manipulación de montacargas',
    'Plancha de drywall afectada por humedad o filtración',
    'Caja de piso flotante con lengüetas de encastre rotas',
    'Diferencia detectada en conteo físico cíclico de almacén',
    'Error en digitación de remisión anterior',
    'Pérdida o extravío en tránsito interno'
  ];

  const filteredAdjustments = adjustments.filter(a =>
    (a.productoNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.numeroAjuste || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.motivo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProd = products.find(p => p.id === Number(form.productoId));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.detalle.trim()) {
      alert('La justificación técnica detallada es obligatoria para realizar un ajuste de inventario.');
      return;
    }

    const res = registerAdjustment({
      productoId: form.productoId,
      tipoAjuste: form.tipoAjuste,
      cantidadAjuste: Number(form.cantidadAjuste),
      motivo: form.motivo,
      detalle: form.detalle.trim()
    });

    if (res.success) {
      setModalOpen(false);
      setForm({
        productoId: products[0] ? String(products[0].id) : '',
        tipoAjuste: 'MERMA_DANO',
        cantidadAjuste: '1',
        motivo: motivosPredefinidos[0],
        detalle: ''
      });
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-semibold">Conciliación Físico vs Sistema</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Ajustes Manuales, Mermas y Roturas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Corrección de discrepancias de existencias mediante justificación obligatoria con impacto contable inmediato.
          </p>
        </div>

        {!isGerencia && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-martin-orange-500 hover:bg-martin-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Registrar Ajuste o Merma
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° Folio, producto o motivo de merma..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Historial de Ajustes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Folio Ajuste</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Artículo / SKU</th>
                <th className="py-3 px-3 text-center">Tipo Ajuste</th>
                <th className="py-3 px-3 text-center">Cant. Ajustada</th>
                <th className="py-3 px-3 text-right">Impacto Costo</th>
                <th className="py-3 px-4">Motivo y Justificación Técnica</th>
                <th className="py-3 px-4">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No se han registrado actas de ajuste o mermas con estos criterios.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(a => {
                  const tipo = a.tipoAjuste || a.tipo || 'MERMA_DANO';
                  const cant = Number(a.cantidadAjustada ?? a.cantidad ?? 1);
                  const sku = a.sku || 'SKU-001';
                  const costo = Number(a.costoUnitario || 100);
                  const impacto = Number(a.impactoEconomico ?? (cant * costo)) || 0;
                  const resp = a.responsable || a.solicitante || 'Encargado de Almacén';
                  const fechaObj = a.fecha ? new Date(a.fecha) : new Date();
                  const fechaValida = !isNaN(fechaObj.getTime());

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.numeroAjuste || `AJU-${a.id}`}</td>
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {fechaValida ? fechaObj.toLocaleDateString('es-PE') : ''} {fechaValida ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{a.productoNombre || 'Producto sin nombre'}</p>
                        <p className="text-[10px] font-mono text-slate-400 font-bold">{sku}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tipo === 'MERMA_DANO'
                            ? 'bg-red-100 text-red-800'
                            : tipo === 'FALTANTE'
                            ? 'bg-martin-orange-100 text-martin-orange-800'
                            : 'bg-martin-green-100 text-martin-green-800'
                        }`}>
                          {String(tipo).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono">
                        {cant} unid.
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        S/ {impacto.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{a.motivo || 'Sin motivo'}</p>
                        {a.detalle && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            "{a.detalle}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {resp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro de Ajuste / Merma */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-martin-orange-500 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Acta de Ajuste de Stock y Merma</h3>
                  <p className="text-xs text-slate-400">Descuento o corrección obligatoriamente auditada</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Producto Afectado *</label>
                <select
                  value={form.productoId}
                  onChange={e => setForm({ ...form, productoId: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.nombre} (Stock actual: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Naturaleza del Ajuste *</label>
                  <select
                    value={form.tipoAjuste}
                    onChange={e => setForm({ ...form, tipoAjuste: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none bg-white"
                  >
                    <option value="MERMA_DANO">Merma / Rotura FÍsica (-)</option>
                    <option value="FALTANTE">Faltante por Inventario (-)</option>
                    <option value="SOBRANTE">Sobrante Físico (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a Ajustar *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.cantidadAjuste}
                    onChange={e => setForm({ ...form, cantidadAjuste: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo Frecuente</label>
                <select
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none bg-white"
                >
                  {motivosPredefinidos.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificación Técnica Detallada *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.detalle}
                  onChange={e => setForm({ ...form, detalle: e.target.value })}
                  placeholder="Detalle exactamente cómo ocurrió el daño, ubicación o discrepancia encontrada..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-orange-500 focus:outline-none"
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
                    <span className="font-bold text-martin-orange-700">
                      S/ {(Number(form.cantidadAjuste || 0) * selectedProd.costoCompra).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-martin-orange-500 hover:bg-martin-orange-600 rounded-xl shadow-md"
                >
                  Asentar Ajuste en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
