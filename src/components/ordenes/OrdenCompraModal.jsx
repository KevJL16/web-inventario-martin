import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Plus, Trash2, Save, Truck, Package } from 'lucide-react';

export const OrdenCompraModal = ({ isOpen, onClose }) => {
  const { suppliers, products, createPurchaseOrder } = useInventory();

  const [proveedorId, setProveedorId] = useState(() => suppliers[0]?.id ? String(suppliers[0].id) : '1');
  const [fechaEsperada, setFechaEsperada] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [observaciones, setObservaciones] = useState('Reposición programada para Almacén Central');
  const [items, setItems] = useState([
    {
      productoId: products[0]?.id ? String(products[0].id) : '1',
      cantidad: '30',
      costoUnit: products[0]?.costoCompra ? String(products[0].costoCompra) : '100'
    }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      {
        productoId: defaultProd ? String(defaultProd.id) : '1',
        cantidad: '20',
        costoUnit: defaultProd ? String(defaultProd.costoCompra) : '50'
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index][field] = value;
      if (field === 'productoId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) {
          next[index].costoUnit = String(prod.costoCompra);
        }
      }
      return next;
    });
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + (Number(it.cantidad) * Number(it.costoUnit)), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.some(it => Number(it.cantidad) <= 0)) {
      alert('Todas las cantidades deben ser mayores a 0.');
      return;
    }

    createPurchaseOrder({
      proveedorId,
      fechaEsperada,
      observaciones,
      items
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nueva Orden de Compra</h3>
              <p className="text-xs text-slate-400">Emisión formal a fabricantes y distribuidores autorizados</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor Fabricante *</label>
              <select
                value={proveedorId}
                onChange={e => setProveedorId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.razonSocial} (RUC: {s.ruc})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Esperada de Llegada *</label>
              <input
                type="date"
                required
                value={fechaEsperada}
                onChange={e => setFechaEsperada(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Líneas de Artículos Solicitados */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Artículos Solicitados ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ítem
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Producto</label>
                    <select
                      value={item.productoId}
                      onChange={e => handleItemChange(idx, 'productoId', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>[{p.sku}] {p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.cantidad}
                      onChange={e => handleItemChange(idx, 'cantidad', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white font-bold text-center"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Costo Unit (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.costoUnit}
                      onChange={e => handleItemChange(idx, 'costoUnit', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-right"
                    />
                  </div>

                  <div className="w-28 text-right font-mono font-bold text-xs pt-3 text-slate-800">
                    S/ {(Number(item.cantidad) * Number(item.costoUnit)).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Instrucciones de Descarga</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Resumen Total */}
          <div className="bg-martin-green-50 p-4 rounded-xl border border-martin-green-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-martin-green-900">Total Presupuestado (Inc. IGV)</p>
              <p className="text-[11px] text-martin-green-800">Generará compromiso de compra oficial</p>
            </div>
            <p className="text-2xl font-black text-martin-green-950 font-mono">
              S/ {calculateTotal().toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-martin-green-500 hover:bg-martin-green-600 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Emitir Orden de Compra
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
