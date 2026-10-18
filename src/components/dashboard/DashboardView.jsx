import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  Layers,
  Clock,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Zap
} from 'lucide-react';

export const DashboardView = ({ setActiveTab, openMovementModal, openAdjustmentModal }) => {
  const { products, movements, purchaseOrders, lowStockAlerts, categories } = useInventory();
  const { currentUser } = useAuth();

  const activeProducts = products.filter(p => p.activo);
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.stockActual, 0);
  const totalValuationCost = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);
  const totalValuationSale = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.precioVenta), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMovements = movements.filter(m => m.fecha.startsWith(todayStr));
  const todayEntries = todayMovements.filter(m => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo));
  const todayExits = todayMovements.filter(m => ['SALIDA_VENTA', 'MERMA', 'AJUSTE_NEGATIVO'].includes(m.tipo));

  const pendingOrders = purchaseOrders.filter(o => o.estado === 'Solicitada' || o.estado === 'Aprobada');

  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida y Resumen */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              RF-14: Dashboard Ejecutivo en Tiempo Real
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Bienvenido, {currentUser?.nombres}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Monitoreo en vivo de inventario maderero, flujo de tableros de melamina, drywall, pisos y alertas de almacén.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('quickstock')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-900/40"
          >
            <Zap className="w-4 h-4" /> Consulta Almacén (RF-18)
          </button>
          <button
            onClick={() => setActiveTab('ajustes')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Registrar Merma (RF-20)
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valorización Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valorización de Stock</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              S/ {totalValuationCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              Venta Estimada: <span className="font-bold text-slate-700">S/ {totalValuationSale.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Unidades Físicas en Almacén */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Existencias Totales</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {totalStockUnits.toLocaleString()} <span className="text-sm font-semibold text-slate-500">unid.</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              En <span className="font-bold text-slate-700">{activeProducts.length}</span> artículos de catálogo activo
            </p>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Bajo / Crítico (RF-09, RF-10) */}
        <div 
          onClick={() => setActiveTab('catalogo')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas de Reorden</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${lowStockAlerts.length > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-red-600">
              {lowStockAlerts.length} <span className="text-sm font-semibold text-slate-500">productos</span>
            </p>
            <p className="text-xs text-red-600/80 font-medium mt-1 group-hover:underline">
              {lowStockAlerts.length > 0 ? 'En o por debajo del stock mínimo →' : 'Sin alertas de desabastecimiento'}
            </p>
          </div>
        </div>

        {/* KPI 4: Movimientos del Día (RF-14) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flujo de Hoy</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {todayMovements.length} <span className="text-sm font-semibold text-slate-500">transacc.</span>
            </p>
            <div className="flex items-center gap-3 text-xs mt-1 font-semibold">
              <span className="text-emerald-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> +{todayEntries.reduce((s, m) => s + m.cantidad, 0)} ent.
              </span>
              <span className="text-rose-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> -{todayExits.reduce((s, m) => s + m.cantidad, 0)} sal.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Distribución por Categoría y Alertas Críticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución por Categoría de Madera y Construcción */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventario por Familia de Artículos</h2>
              <p className="text-xs text-slate-500">Distribución de volumen físico en almacén central</p>
            </div>
            <button
              onClick={() => setActiveTab('catalogo')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              Ver Catálogo Completo →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categories.map(cat => {
              const catProds = activeProducts.filter(p => p.categoriaId === cat.id);
              const totalUnits = catProds.reduce((sum, p) => sum + p.stockActual, 0);
              const valCost = catProds.reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);

              return (
                <div key={cat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{cat.nombre}</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {catProds.length} ítems
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-xl font-black text-slate-900">{totalUnits} <span className="text-xs font-semibold text-slate-500">unid.</span></p>
                      <p className="text-[11px] text-slate-500 font-medium">S/ {valCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {totalStockUnits > 0 ? ((totalUnits / totalStockUnits) * 100).toFixed(1) : 0}% del stock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Alertas y Órdenes Pendientes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Atención Inmediata
              </h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                RF-09 / RF-10
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Productos que requieren reposición inmediata</p>

            <div className="space-y-2.5">
              {lowStockAlerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Todos los tableros y planchas cuentan con stock sobre el punto de pedido.</span>
                </div>
              ) : (
                lowStockAlerts.slice(0, 3).map(prod => (
                  <div key={prod.id} className="p-3 rounded-xl border border-red-200/80 bg-red-50/50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{prod.nombre}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                        {prod.stockActual} en stock
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mínimo: <span className="font-bold">{prod.stockMinimo}</span> | Ubicación: <span className="font-mono text-amber-800">{prod.ubicacionCodigo}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">Órdenes de Compra por recibir:</span>
              <span className="font-bold text-slate-800">{pendingOrders.length}</span>
            </div>
            <button
              onClick={() => setActiveTab('ordenes')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              Gestionar Cadena de Suministro (RF-13)
            </button>
          </div>
        </div>

      </div>

      {/* Movimientos Recientes del Día (RF-14, RF-16) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Últimos Movimientos de Inventario</h2>
            <p className="text-xs text-slate-500">Trazabilidad inmutable de salidas, recepciones y mermas</p>
          </div>
          <button
            onClick={() => setActiveTab('movimientos')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            Ver Historial Completo (RF-16) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100 uppercase">
              <tr>
                <th className="py-3 px-3">Fecha / Hora</th>
                <th className="py-3 px-3">Tipo Movimiento</th>
                <th className="py-3 px-3">Artículo / SKU</th>
                <th className="py-3 px-3 text-center">Cantidad</th>
                <th className="py-3 px-3 text-right">Costo Unit.</th>
                <th className="py-3 px-3">Comprobante</th>
                <th className="py-3 px-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.slice(0, 5).map(m => {
                const esEntrada = ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(m.tipo);
                const esMerma = m.tipo === 'MERMA';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        esMerma
                          ? 'bg-amber-100 text-amber-800'
                          : esEntrada
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{m.productoNombre}</p>
                      <p className="text-[10px] font-mono text-slate-400">{m.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={esEntrada ? 'text-emerald-700' : 'text-rose-700'}>
                        {esEntrada ? '+' : '-'}{m.cantidad}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      S/ {m.costoUnitario.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {m.comprobante}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {m.usuarioNombre}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
