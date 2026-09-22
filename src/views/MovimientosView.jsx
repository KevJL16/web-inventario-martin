import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  ShoppingCart,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';
import { VentaModal } from './components/VentaModal';

export const MovimientosView = () => {
  const { movements, products, registerMovement } = useInventory();
  const { isGerencia, currentUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [form, setForm] = useState({
    productoId: products.length > 0 ? String(products[0].id) : '',
    tipo: 'ENTRADA_COMPRA',
    cantidad: '10',
    costoUnitario: '',
    comprobante: '',
    observacion: ''
  });

  const filteredMovements = movements.filter(m => {
    const matchesSearch =
      (m.productoNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.comprobante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.usuarioNombre || m.usuario || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || m.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const handleOpenModal = () => {
    const prod = products[0];
    setForm({
      productoId: prod ? String(prod.id) : '',
      tipo: 'ENTRADA_COMPRA',
      cantidad: '10',
      costoUnitario: prod ? String(prod.costoCompra) : '0',
      comprobante: `GR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      observacion: ''
    });
    setModalOpen(true);
  };

  const handleProductChange = (prodId) => {
    const prod = products.find(p => p.id === Number(prodId));
    setForm(prev => ({
      ...prev,
      productoId: prodId,
      costoUnitario: prod ? String(prod.costoCompra) : prev.costoUnitario
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = registerMovement({
      productoId: form.productoId,
      tipo: form.tipo,
      cantidad: Number(form.cantidad),
      costoUnitario: Number(form.costoUnitario),
      comprobante: form.comprobante.trim(),
      observacion: form.observacion.trim()
    });

    if (res.success) {
      setModalOpen(false);
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
            <span className="text-xs text-slate-500 font-semibold">Auditoría Inalterable de Almacén</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Historial de Movimientos de Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico inmutable de ingresos por compra, salidas por venta, despachos y transferencias de patio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Registrar Venta: Solo Administrador y Vendedor */}
          {['Administrador', 'Vendedor'].includes(currentUser?.rolNombre) && (
            <button
              onClick={() => setVentaModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-martin-orange-500 hover:bg-martin-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Registrar una salida por venta inmediata"
            >
              <ShoppingCart className="w-4 h-4" /> Registrar Venta
            </button>
          )}

          {/* Movimiento General: Solo Administrador y Encargado de Almacén */}
          {['Administrador', 'Encargado de Almacén'].includes(currentUser?.rolNombre) && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Movimiento General
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por artículo, SKU, comprobante o usuario..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tipo:
          </span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-martin-green-500 text-slate-700"
          >
            <option value="ALL">Todos los tipos ({movements.length})</option>
            <option value="SALIDA_VENTA">Salida por Venta</option>
            <option value="ENTRADA_COMPRA">Entrada por Compra</option>
            <option value="MERMA">Merma / Daño</option>
            <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
            <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-3">Tipo Operación</th>
                <th className="py-3 px-3">Artículo / SKU</th>
                <th className="py-3 px-3 text-center">Variación</th>
                <th className="py-3 px-3 text-center">Stock Resultante</th>
                <th className="py-3 px-3 text-right">Monto Total</th>
                <th className="py-3 px-3">Documento Ref.</th>
                <th className="py-3 px-4">Responsable & Glosa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No se encontraron transacciones registradas con los criterios dados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const esEntrada = ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo);
                  const esVenta = m.tipo === 'SALIDA_VENTA';
                  const esMerma = m.tipo === 'MERMA';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(m.fecha).toLocaleDateString('es-PE')} {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          esVenta
                            ? 'bg-martin-orange-100 text-martin-orange-800 border border-martin-orange-200'
                            : esMerma
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : esEntrada
                            ? 'bg-martin-green-100 text-martin-green-800 border border-martin-green-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {(m.tipo || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{m.productoNombre}</p>
                        <p className="text-[10px] font-mono text-slate-400 font-bold">{m.sku}</p>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-sm">
                        <span className={esEntrada ? 'text-martin-green-700' : 'text-martin-orange-600'}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="text-[11px] text-slate-400">{m.stockAnterior ?? 0} → </span>
                        <span className="font-bold text-slate-900">{m.stockPosterior ?? m.cantidad}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-slate-800">S/ {Number(m.total || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Unit: S/ {Number(m.costoUnitario || 0).toFixed(2)}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                        {m.comprobante}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{m.usuarioNombre}</p>
                        {m.observacion && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs" title={m.observacion}>
                            "{m.observacion}"
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro de Movimiento General */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-martin-green-500 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Registrar Transacción de Almacén</h3>
                  <p className="text-xs text-slate-400">Entradas de compra, mermas o transferencias</p>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Artículo *</label>
                <select
                  value={form.productoId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Operación *</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-white"
                  >
                    <option value="ENTRADA_COMPRA">Entrada por Compra</option>
                    <option value="SALIDA_VENTA">Salida por Venta / Despacho</option>
                    <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
                    <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.cantidad}
                    onChange={e => setForm({ ...form, cantidad: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Costo Unitario (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.costoUnitario}
                    onChange={e => setForm({ ...form, costoUnitario: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Comprobante / Guía *</label>
                  <input
                    type="text"
                    required
                    value={form.comprobante}
                    onChange={e => setForm({ ...form, comprobante: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none"
                    placeholder="FAC-001-XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Motivo</label>
                <textarea
                  rows={2}
                  value={form.observacion}
                  onChange={e => setForm({ ...form, observacion: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none"
                  placeholder="Detalle de entrega, transportista o referencia de cliente..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-martin-green-500 hover:bg-martin-green-600 rounded-xl shadow-md"
                >
                  Asentar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dedicado de Venta */}
      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
      />

    </div>
  );
};
