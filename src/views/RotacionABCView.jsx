import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
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

  const productSalidas = {};
  movements.filter(m => m.tipo === 'SALIDA_VENTA').forEach(m => {
    productSalidas[m.productoId] = (productSalidas[m.productoId] || 0) + m.cantidad;
  });

  const productsWithMetrics = products.filter(p => p.activo).map(p => {
    const salidas = productSalidas[p.id] || 0;
    const tasaRotacion = p.stockActual > 0 ? (salidas / p.stockActual).toFixed(2) : '0.00';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-martin-green-700 bg-martin-green-50 px-2.5 py-0.5 rounded-full border border-martin-green-200">
              Rotación y Demanda
            </span>
            <span className="text-xs text-slate-500 font-medium">Clasificación Algorítmica ABC de Pareto</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Análisis de Rotación de Inventario ABC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Segmentación estratégica de existencias por volumen de ventas y detección de stock estancado.
          </p>
        </div>

        <button
          onClick={recalculateABC}
          className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Recalcular Clasificación ABC
        </button>
      </div>

      {/* Tarjetas Resumen ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => setFilterABC('A')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            filterABC === 'A' ? 'border-martin-green-500 shadow-sm' : 'border-slate-200 hover:border-martin-green-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-martin-green-800 bg-martin-green-100 px-3 py-1 rounded-lg">
              CLASE A (Alta Rotación)
            </span>
            <span className="text-xs font-bold text-slate-400">Top 20% Demanda</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{countA} Productos</p>
          <p className="text-xs text-slate-500 mt-1">Generan el 80% de salidas de almacén. Reabastecimiento prioritario.</p>
        </div>

        <div 
          onClick={() => setFilterABC('B')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            filterABC === 'B' ? 'border-martin-orange-500 shadow-sm' : 'border-slate-200 hover:border-martin-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-martin-orange-800 bg-martin-orange-100 px-3 py-1 rounded-lg">
              CLASE B (Rotación Media)
            </span>
            <span className="text-xs font-bold text-slate-400">~30% Demanda</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{countB} Productos</p>
          <p className="text-xs text-slate-500 mt-1">Demanda intermedia regular. Control estándar de reorden.</p>
        </div>

        <div 
          onClick={() => setFilterABC('C')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
            filterABC === 'C' ? 'border-red-500 shadow-sm' : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-800 bg-red-100 px-3 py-1 rounded-lg">
              CLASE C (Baja / Estancado)
            </span>
            <span className="text-xs font-bold text-slate-400">~50% Catálogo</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{countC} Productos</p>
          <p className="text-xs text-slate-500 mt-1">Capital inmovilizado en Clase C: <strong>S/ {valorC.toFixed(2)}</strong></p>
        </div>

      </div>

      {/* Tabla de Clasificación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Clasificación</th>
                <th className="py-3 px-3">Artículo / SKU</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-center">Unid. Despachadas</th>
                <th className="py-3 px-3 text-center">Stock Actual</th>
                <th className="py-3 px-3 text-center">Tasa Rotación</th>
                <th className="py-3 px-4 text-right">Días Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`w-8 h-8 rounded-xl font-black text-xs inline-flex items-center justify-center ${
                      p.clasificacionABC === 'A'
                        ? 'bg-martin-green-100 text-martin-green-800 border border-martin-green-300'
                        : p.clasificacionABC === 'B'
                        ? 'bg-martin-orange-100 text-martin-orange-800 border border-martin-orange-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {p.clasificacionABC}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-slate-900">{p.nombre}</p>
                    <p className="text-[10px] font-mono text-slate-400 font-bold">{p.sku}</p>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700">{p.categoriaNombre}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-martin-green-700">{p.salidas}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">{p.stockActual}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">{p.tasaRotacion}x</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                    {p.diasInventario >= 999 ? 'Sin salidas' : `${p.diasInventario} días`}
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
