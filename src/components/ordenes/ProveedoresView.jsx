import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
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
import { OrdenCompraModal } from './OrdenCompraModal';

export const ProveedoresView = () => {
  const { suppliers, purchaseOrders, receivePurchaseOrder } = useInventory();
  const { currentUser, isGerencia } = useAuth();

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-13
            </span>
            <span className="text-xs text-slate-500 font-medium">Cadena de Suministro Maderera</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Proveedores y Gestión de Órdenes de Compra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de compras a fabricantes (Arauco, Pelíkano, Masisa, Gyplac), recepción en patio y liquidación de existencias.
          </p>
        </div>

        {!isGerencia && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Generar Orden de Compra (RF-13)
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Órdenes de Compra ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Directorio de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* Contenido según Tab */}
      {activeTab === 'orders' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map(order => {
              const isReceived = order.estado === 'Recepcionada';

              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          {order.numeroOrden}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isReceived
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.estado}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-2">{order.proveedorNombre}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Emisión: {order.fechaEmision} • Llegada Estimada: <span className="font-semibold text-slate-700">{order.fechaEsperada}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Facturado</span>
                      <p className="text-base font-black text-slate-900 font-mono">
                        S/ {order.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Detalle de ítems */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Líneas de pedido:</p>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="text-xs flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-800 font-medium truncate max-w-[240px]">{it.nombre}</span>
                        <div className="font-mono text-right shrink-0">
                          <span className="font-bold text-slate-900">{it.cantidad} unid.</span>
                          <span className="text-[11px] text-slate-500 ml-2">@ S/ {it.costoUnit.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Acciones de la Orden */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 italic">
                      "{order.observaciones}"
                    </span>

                    {!isReceived && !isGerencia && (
                      <button
                        onClick={() => handleReceive(order.id, order.numeroOrden)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recepcionar en Almacén
                      </button>
                    )}

                    {isReceived && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Ingresado al Kardex
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Directorio de Proveedores */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sup.razonSocial}</h3>
                  <p className="text-xs font-medium text-amber-700">{sup.nombreComercial}</p>
                </div>
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-xs font-bold ml-1 text-slate-700">{sup.calificacion}.0</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-700">RUC: {sup.ruc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.telefono} ({sup.contacto})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sup.correo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sup.direccion}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                {sup.categorias.map((cat, idx) => (
                  <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <OrdenCompraModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
};
