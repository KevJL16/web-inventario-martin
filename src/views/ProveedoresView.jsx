import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  Layers,
  Search
} from 'lucide-react';
import { OrdenCompraModal } from '../components/ordenes/OrdenCompraModal';

export const ProveedoresView = () => {
  const { suppliers, purchaseOrders, receivePurchaseOrder } = useInventory();
  const { isGerencia } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'suppliers'
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleReceive = (orderId, numeroOrden) => {
    if (window.confirm(`¿Confirmas la recepción física y entrada a almacén de la O/C ${numeroOrden}? Los saldos de inventario y Kardex se actualizarán automáticamente.`)) {
      const res = receivePurchaseOrder(orderId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-martin-green-700 bg-martin-green-50 px-2.5 py-0.5 rounded-full border border-martin-green-200">
              Cadena de Suministro
            </span>
            <span className="text-xs text-slate-500 font-medium">Reabastecimiento y Proveedores</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Proveedores y Órdenes de Compra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de compras a fabricantes (Arauco, Pelíkano, Masisa, Gyplac), recepción en patio y liquidación de existencias.
          </p>
        </div>

        {!isGerencia && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Orden de Compra
          </button>
        )}
      </div>

      {/* Selector de Pestañas Internas */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-martin-green-500 text-martin-green-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Órdenes de Compra Emitidas ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-martin-green-500 text-martin-green-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Directorio de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'orders' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">N° Orden</th>
                  <th className="py-3 px-3">Proveedor</th>
                  <th className="py-3 px-3">Emisión</th>
                  <th className="py-3 px-3">Fecha Esperada</th>
                  <th className="py-3 px-3">Items Solicitados</th>
                  <th className="py-3 px-3 text-right">Total O/C</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No hay órdenes de compra registradas.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.numeroOrden}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">{o.proveedorNombre}</td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono">{o.fechaEmision}</td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono">{o.fechaEsperada}</td>
                      <td className="py-3.5 px-3">
                        <div className="text-[11px] text-slate-600 font-medium">
                          {o.items.map((it, idx) => (
                            <span key={idx} className="inline-block mr-2">
                              • {it.cantidad} {it.productoNombre}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        S/ {o.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.estado === 'Recepcionada'
                            ? 'bg-martin-green-100 text-martin-green-800'
                            : 'bg-martin-orange-100 text-martin-orange-800'
                        }`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {o.estado !== 'Recepcionada' ? (
                          <button
                            onClick={() => handleReceive(o.id, o.numeroOrden)}
                            className="px-2.5 py-1 bg-martin-green-500 hover:bg-martin-green-600 text-white font-bold text-[10px] rounded-lg shadow-xs transition-colors"
                          >
                            Recepcionar en Patio
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Completada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.razonSocial}</h3>
                  <p className="text-[11px] font-mono text-slate-500">RUC: {s.ruc}</p>
                </div>
                <span className="text-xs font-bold text-martin-orange-700 bg-martin-orange-50 px-2 py-0.5 rounded-full border border-martin-orange-200">
                  {s.rubro}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.telefono}</p>
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</p>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.direccion}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva O/C */}
      <OrdenCompraModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
};
