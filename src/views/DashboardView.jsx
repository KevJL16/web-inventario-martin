import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  Layers,
  Clock,
  Zap,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { VentaModal } from './components/VentaModal';

export const DashboardView = ({ setActiveTab }) => {
  const { products, movements, purchaseOrders, lowStockAlerts, categories } = useInventory();
  const { currentUser } = useAuth();
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [periodo, setPeriodo] = useState('diario'); // 'diario' | 'semanal' | 'mensual' | 'anual'

  const activeProducts = products.filter(p => p.activo);
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.stockActual, 0);
  const totalValuationCost = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);
  const totalValuationSale = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.precioVenta), 0);

  const pendingOrders = purchaseOrders.filter(o => o.estado === 'Solicitada' || o.estado === 'Aprobada');

  // Filtro de movimientos según período seleccionado
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredMovements = movements.filter(m => {
    if (!m.fecha) return false;
    const mDate = new Date(m.fecha);
    if (isNaN(mDate.getTime())) return false;

    if (periodo === 'diario') {
      return m.fecha.startsWith(todayStr);
    }
    if (periodo === 'semanal') {
      const diffDays = (now - mDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (periodo === 'mensual') {
      return mDate.getFullYear() === now.getFullYear() && mDate.getMonth() === now.getMonth();
    }
    if (periodo === 'anual') {
      return mDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const periodEntries = filteredMovements.filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo));
  const periodExits = filteredMovements.filter(m => ['SALIDA_VENTA', 'MERMA', 'AJUSTE_NEGATIVO'].includes(m.tipo));
  const totalEntriesQty = periodEntries.reduce((s, m) => s + (m.cantidad || 0), 0);
  const totalExitsQty = periodExits.reduce((s, m) => s + (m.cantidad || 0), 0);
  const totalValuationPeriod = filteredMovements.reduce((s, m) => s + (m.total || 0), 0);

  const periodoLabels = {
    diario: 'Hoy',
    semanal: 'Últimos 7 días',
    mensual: 'Este Mes',
    anual: 'Este Año'
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Minimalista con Acento Verde & Naranja */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-martin-green-50 text-martin-green-800 border border-martin-green-200">
              Panel Principal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bienvenido, {currentUser?.nombres}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Control integral de inventario: tableros de melamina, drywall, perfiles de acero, pisos y gestión comercial.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          {['Administrador', 'Vendedor'].includes(currentUser?.rolNombre) && (
            <button
              onClick={() => setVentaModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              title="Registrar una nueva venta o salida de mercadería"
            >
              <ShoppingCart className="w-4 h-4" /> Registrar Venta
            </button>
          )}
          {['Administrador', 'Encargado de Almacén'].includes(currentUser?.rolNombre) && (
            <>
              <button
                onClick={() => setActiveTab('quickstock')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-martin-orange-500" /> Consulta Rápida
              </button>
              <button
                onClick={() => setActiveTab('ajustes')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-martin-orange-500" /> Mermas y Ajustes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valorización Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-martin-green-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valorización de Stock</span>
            <div className="w-9 h-9 rounded-xl bg-martin-green-50 text-martin-green-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              S/ {totalValuationCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              Venta Estimada: <span className="font-bold text-martin-green-700">S/ {totalValuationSale.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Unidades Físicas en Almacén */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-martin-green-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Existencias Totales</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-martin-orange-500" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {totalStockUnits.toLocaleString('es-PE')}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Planchas, cajas y unidades activas
            </p>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Crítico */}
        <div 
          onClick={() => setActiveTab('catalogo')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-martin-orange-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stock Crítico</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              lowStockAlerts.length > 0 ? 'bg-martin-orange-50 text-martin-orange-600' : 'bg-martin-green-50 text-martin-green-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-black ${lowStockAlerts.length > 0 ? 'text-martin-orange-600' : 'text-martin-green-700'}`}>
              {lowStockAlerts.length} {lowStockAlerts.length === 1 ? 'Producto' : 'Productos'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lowStockAlerts.length > 0 ? 'Requieren orden de compra inmediata' : 'Inventario en niveles óptimos'}
            </p>
          </div>
        </div>

        {/* KPI 4: Órdenes de Compra Pendientes */}
        <div 
          onClick={() => setActiveTab('ordenes')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-martin-green-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reabastecimiento</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-martin-green-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'Orden' : 'Órdenes'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Por recepcionar en patio
            </p>
          </div>
        </div>

      </div>

      {/* Flujo de Movimientos con Selector de Período */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Actividad de Movimientos con Selector (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          
          {/* Header de la sección con selector de período */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Actividad de Movimientos</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {periodoLabels[periodo]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Filtrado cronológico de entradas, salidas y transferencias</p>
            </div>

            {/* Selector de Período: Diarios, Semanales, Mensuales, Anuales */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              {[
                { id: 'diario', label: 'Diarios' },
                { id: 'semanal', label: 'Semanales' },
                { id: 'mensual', label: 'Mensuales' },
                { id: 'anual', label: 'Anuales' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    periodo === p.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ficha Resumen del Período */}
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Transacciones</span>
              <span className="text-sm font-black text-slate-900 font-mono">{filteredMovements.length}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Entradas</span>
              <span className="text-sm font-black text-martin-green-700 font-mono">+{totalEntriesQty} unid.</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Salidas</span>
              <span className="text-sm font-black text-martin-orange-600 font-mono">-{totalExitsQty} unid.</span>
            </div>
          </div>

          {/* Lista de Movimientos */}
          <div className="divide-y divide-slate-100">
            {filteredMovements.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No se registran transacciones para el período seleccionado ({periodoLabels[periodo]}).</p>
                <p className="text-[11px] mt-1 text-slate-400">Seleccione otro período o registre una nueva operación.</p>
              </div>
            ) : (
              filteredMovements.slice(0, 7).map(m => {
                const esEntrada = ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo);

                return (
                  <div key={m.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        esEntrada ? 'bg-martin-green-100 text-martin-green-800' : 'bg-martin-orange-100 text-martin-orange-800'
                      }`}>
                        {esEntrada ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{m.productoNombre}</p>
                        <p className="text-[11px] text-slate-500">
                          {m.tipo.replace(/_/g, ' ')} • <span className="font-mono font-medium">{m.comprobante}</span>
                          <span className="text-slate-400 ml-1.5">• {new Date(m.fecha).toLocaleDateString('es-PE')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-xs font-bold font-mono ${esEntrada ? 'text-martin-green-700' : 'text-martin-orange-600'}`}>
                        {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`} unid.
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        S/ {Number(m.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => setActiveTab('movimientos')}
              className="text-xs font-bold text-martin-green-700 hover:text-martin-green-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              Ver Todos los Movimientos →
            </button>
          </div>
        </div>

        {/* Columna Derecha: Top Categorías */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Distribución por Rubro</h2>
            <p className="text-xs text-slate-500 mb-4">Stock disponible por familia de productos</p>
            
            <div className="space-y-3">
              {categories.map(cat => {
                const prodsInCat = activeProducts.filter(p => p.categoriaId === cat.id);
                const unitsInCat = prodsInCat.reduce((sum, p) => sum + p.stockActual, 0);
                const percent = totalStockUnits > 0 ? Math.round((unitsInCat / totalStockUnits) * 100) : 0;

                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{cat.nombre}</span>
                      <span className="text-slate-500 font-normal">{unitsInCat} unid. ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-martin-green-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Modal Dedicado de Registro de Venta */}
      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
      />

    </div>
  );
};
