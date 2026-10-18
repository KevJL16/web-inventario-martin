import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
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

export const AjustesStockModal = () => {
  const { products, adjustments, registerAdjustment } = useInventory();
  const { currentUser, isGerencia } = useAuth();

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
    a.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.numeroAjuste.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.motivo.toLowerCase().includes(searchTerm.toLowerCase())
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
      setForm(prev => ({ ...prev, detalle: '' }));
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-20
            </span>
            <span className="text-xs text-slate-500 font-medium">Control de Pérdidas y Auditoría Física</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Ajustes Manuales Justificados de Inventario (Mermas / Conteos)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Regularización formal entre el saldo contable en sistema y el conteo físico real (mermas por rotura de tableros, daños de montacargas o descuadres).
          </p>
        </div>

        {!isGerencia && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Registrar Ajuste / Merma Justificada
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por folio, artículo o motivo de ajuste..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de Ajustes Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Folio Ajuste</th>
                <th className="py-3.5 px-3">Fecha / Hora</th>
                <th className="py-3.5 px-3">Tipo Ajuste</th>
                <th className="py-3.5 px-3">Artículo Afectado</th>
                <th className="py-3.5 px-3 text-center">Cant. Ajustada</th>
                <th className="py-3.5 px-3 text-center">Stock Sistema → Real</th>
                <th className="py-3.5 px-4">Motivo y Justificación Técnica</th>
                <th className="py-3.5 px-3">Autorización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se han registrado solicitudes de ajuste o merma.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(aj => (
                  <tr key={aj.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {aj.numeroAjuste}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(aj.fecha).toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        aj.tipo === 'MERMA_DANO'
                          ? 'bg-red-100 text-red-800'
                          : aj.tipo === 'FALTANTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {aj.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {aj.productoNombre}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-sm">
                      {aj.cantidad} unid.
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-slate-400">{aj.stockSistema}</span> →{' '}
                      <span className="font-bold text-slate-900">{aj.stockFisicoReal}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-800">{aj.motivo}</p>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">"{aj.detalle}"</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-[11px]">
                        <p className="text-slate-600 font-medium">Sol: {aj.solicitante}</p>
                        <p className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro de Ajuste Manual Justificado (RF-20) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ajuste Manual Justificado (RF-20)</h3>
                  <p className="text-xs text-slate-400">Regularización por merma física o conteo cíclico</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Producto a Ajustar *</label>
                <select
                  value={form.productoId}
                  onChange={e => setForm({ ...form, productoId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.nombre} (Stock en Sistema: {p.stockActual})
                    </option>
                  ))}
                </select>
                {selectedProd && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ubicación actual: <span className="font-mono text-amber-800 font-bold">{selectedProd.ubicacionCodigo}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Ajuste *</label>
                  <select
                    value={form.tipoAjuste}
                    onChange={e => setForm({ ...form, tipoAjuste: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="MERMA_DANO">Merma por Daño Físico (-)</option>
                    <option value="FALTANTE">Faltante Conteo Físico (-)</option>
                    <option value="SOBRANTE">Sobrante Conteo Físico (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a Regularizar *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.cantidadAjuste}
                    onChange={e => setForm({ ...form, cantidadAjuste: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Causal / Motivo Predefinido *</label>
                <select
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {motivosPredefinidos.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificación Técnica Detallada (Obligatoria para Auditoría) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.detalle}
                  onChange={e => setForm({ ...form, detalle: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Especifique las circunstancias del daño o diferencia: número de lote, inspección ocular del supervisor, zona de daño..."
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Efecto Inmediato en Sistema:
                </p>
                <p className="mt-0.5">
                  Esta acción actualizará el saldo físico del producto, creará un asiento inmutable en el Kardex y generará una entrada en la bitácora de auditoría (RF-22).
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md"
                >
                  Confirmar y Asentar Ajuste
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
