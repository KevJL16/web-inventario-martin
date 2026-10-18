import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  TrendingUp,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Clock,
  PieChart,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const RotacionABCView = () => {
  const { products, movements, recalculateABC } = useInventory();
  const [filterABC, setFilterABC] = useState('ALL');

  // Calcular salidas acumuladas por producto
  const productSalidas = {};
  movements.filter(m => m.tipo === 'SALIDA_VENTA').forEach(m => {
    productSalidas[m.productoId] = (productSalidas[m.productoId] || 0) + m.cantidad;
  });

  const productsWithMetrics = products.filter(p => p.activo).map(p => {
    const salidas = productSalidas[p.id] || 0;
    // Rotación = Salidas / Stock Promedio (aproximado)
    const tasaRotacion = p.stockActual > 0 ? (salidas / p.stockActual).toFixed(2) : '0.00';
    // Días de inventario estimados = (Stock Actual / (Salidas diarias asumidas o mín 1)) * 30
    const diasInventario = salidas > 0 ? Math.round((p.stockActual / salidas) * 30) : 999;

    return {
      ...p,
      salidas,
      tasaRotacion: Number(tasaRotacion),
      diasInventario: Math.min(999, diasInventario)
    };
  });

  const filtered = productsWithMetrics.filter(p => {
    if (filterABC === 'ALL') return true;
    return p.clasificacionABC === filterABC;
  });

  const countA = productsWithMetrics.filter(p => p.clasificacionABC === 'A').length;
  const countB = productsWithMetrics.filter(p => p.clasificacionABC === 'B').length;
  const countC = productsWithMetrics.filter(p => p.clasificacionABC === 'C').length;

  const valorC = productsWithMetrics
    .filter(p => p.clasificacionABC === 'C')
    .reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-15
            </span>
            <span className="text-xs text-slate-500 font-medium">Análisis de Demanda y Rotación Pareto</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Índice de Rotación y Clasificación ABC de Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluación analítica del flujo de salidas para tableros de melamina, planchas drywall y pisos de alta vs baja demanda.
          </p>
        </div>

        <button
          onClick={recalculateABC}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" /> Recalcular Matriz ABC
        </button>
      </div>

      {/* Tarjetas de Estratificación ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Clase A */}
        <div
          onClick={() => setFilterABC(filterABC === 'A' ? 'ALL' : 'A')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterABC === 'A'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800">
              CLASE A (Alta Demanda)
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono">80% Flujo Ventas</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {countA} <span className="text-sm font-semibold text-slate-500">artículos</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Melaminas blancas, planchas drywall estándar de yeso y herrajes de rotación diaria.
          </p>
        </div>

        {/* Clase B */}
        <div
          onClick={() => setFilterABC(filterABC === 'B' ? 'ALL' : 'B')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterABC === 'B'
              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-800">
              CLASE B (Demanda Media)
            </span>
            <span className="text-xs font-bold text-blue-700 font-mono">15% Flujo Ventas</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {countB} <span className="text-sm font-semibold text-slate-500">artículos</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Melaminas veteadas maderadas, pisos laminados AC4 y planchas RH antihumedad.
          </p>
        </div>

        {/* Clase C */}
        <div
          onClick={() => setFilterABC(filterABC === 'C' ? 'ALL' : 'C')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterABC === 'C'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900">
              CLASE C (Baja Rotación)
            </span>
            <span className="text-xs font-bold text-amber-700 font-mono">5% Flujo Ventas</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {countC} <span className="text-sm font-semibold text-slate-500">artículos</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Capital inmovilizado en Clase C: <span className="font-bold text-slate-800">S/ {valorC.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

      </div>

      {/* Tabla de Artículos Clasificados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Artículos mostrados: {filtered.length} (Filtro: {filterABC})
          </span>
          {filterABC !== 'ALL' && (
            <button
              onClick={() => setFilterABC('ALL')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Restablecer filtro a Todos
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Clasificación ABC</th>
                <th className="py-3 px-3">Artículo / Familia</th>
                <th className="py-3 px-3 text-center">Salidas Registradas</th>
                <th className="py-3 px-3 text-center">Stock Actual</th>
                <th className="py-3 px-3 text-center">Tasa de Rotación</th>
                <th className="py-3 px-3 text-center">Días de Inventario Estimados</th>
                <th className="py-3 px-4 text-right">Valor Inmovilizado (Costo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                      p.clasificacionABC === 'A'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.clasificacionABC === 'B'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {p.clasificacionABC}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-slate-900">{p.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SKU: <span className="font-bold text-slate-700">{p.sku}</span> • {p.categoriaNombre}
                    </p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                    {p.salidas} {p.unidadMedida}s
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-700">
                    {p.stockActual} {p.unidadMedida}s
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                    {p.tasaRotacion}x
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      p.diasInventario > 90
                        ? 'bg-red-100 text-red-800'
                        : p.diasInventario > 45
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.diasInventario >= 999 ? 'Sin salidas rec.' : `${p.diasInventario} días`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    S/ {(p.stockActual * p.costoCompra).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
