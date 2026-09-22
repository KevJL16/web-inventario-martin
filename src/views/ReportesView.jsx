import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  FileText,
  Download,
  Printer,
  DollarSign,
  Package,
  AlertTriangle,
  Layers,
  MapPin,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export const ReportesView = () => {
  const { products, locations, lowStockAlerts } = useInventory();
  const [reportType, setReportType] = useState('VALORIZADO'); // VALORIZADO, REABASTECIMIENTO, OCUPABILIDAD

  const activeProducts = products.filter(p => p.activo);
  const totalCost = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.costoCompra), 0);
  const totalSale = activeProducts.reduce((sum, p) => sum + (p.stockActual * p.precioVenta), 0);
  const estimatedMargin = totalSale - totalCost;

  const exportCSV = () => {
    let headers = [];
    let rows = [];
    let fileName = 'Reporte_Inventario.csv';

    if (reportType === 'VALORIZADO') {
      headers = ['SKU', 'Nombre', 'Categoria', 'Stock Actual', 'Costo Compra S/', 'Valor Costo Total S/', 'Precio Venta S/', 'Valor Venta Total S/', 'Margen Bruto S/'];
      rows = activeProducts.map(p => [
        p.sku,
        `"${p.nombre}"`,
        p.categoriaNombre,
        p.stockActual,
        p.costoCompra.toFixed(2),
        (p.stockActual * p.costoCompra).toFixed(2),
        p.precioVenta.toFixed(2),
        (p.stockActual * p.precioVenta).toFixed(2),
        ((p.precioVenta - p.costoCompra) * p.stockActual).toFixed(2)
      ]);
      fileName = 'Reporte_Valorizado_Existencias.csv';
    } else if (reportType === 'REABASTECIMIENTO') {
      headers = ['SKU', 'Nombre', 'Stock Actual', 'Stock Minimo', 'Unidades a Reordenar', 'Proveedor Principal', 'Ubicacion Rack'];
      rows = lowStockAlerts.map(p => [
        p.sku,
        `"${p.nombre}"`,
        p.stockActual,
        p.stockMinimo,
        p.stockMaximo - p.stockActual,
        `"${p.proveedorNombre}"`,
        p.ubicacionCodigo
      ]);
      fileName = 'Reporte_Reposicion_Critica.csv';
    } else {
      headers = ['Codigo Ubicacion', 'Zona', 'Pasillo', 'Rack', 'Nivel', 'Capacidad Kg', 'Carga Actual Kg', '% Ocupabilidad'];
      rows = locations.map(l => {
        const prods = activeProducts.filter(p => p.ubicacionId === l.id);
        const weight = prods.reduce((sum, p) => sum + (p.stockActual * p.pesoUnitarioKg), 0);
        return [
          l.codigo,
          l.zona,
          l.pasillo,
          l.rack,
          l.nivel,
          l.capacidadCargaKg,
          weight,
          Math.min(100, Math.round((weight / l.capacidadCargaKg) * 100))
        ];
      });
      fileName = 'Reporte_Ocupabilidad_Patio.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-martin-green-700 bg-martin-green-50 px-2.5 py-0.5 rounded-full border border-martin-green-200">
              Reportería e Inteligencia de Negocio
            </span>
            <span className="text-xs text-slate-500 font-medium">Exportación Ejecutiva y Balances</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Reportes Ejecutivos de Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Valorización de existencias, cálculo de márgenes comerciales y ocupabilidad física de racks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-martin-green-600" /> Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setReportType('VALORIZADO')}
          className={`pb-3 transition-colors border-b-2 ${
            reportType === 'VALORIZADO'
              ? 'border-martin-green-500 text-martin-green-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          1. Inventario Valorizado & Margen Comercial
        </button>
        <button
          onClick={() => setReportType('REABASTECIMIENTO')}
          className={`pb-3 transition-colors border-b-2 ${
            reportType === 'REABASTECIMIENTO'
              ? 'border-martin-green-500 text-martin-green-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          2. Sugerencias de Reabastecimiento Crítico ({lowStockAlerts.length})
        </button>
        <button
          onClick={() => setReportType('OCUPABILIDAD')}
          className={`pb-3 transition-colors border-b-2 ${
            reportType === 'OCUPABILIDAD'
              ? 'border-martin-green-500 text-martin-green-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          3. Ocupabilidad y Capacidad de Carga en Racks
        </button>
      </div>

      {/* Contenido según tipo */}
      {reportType === 'VALORIZADO' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Costo Total Compra</span>
              <p className="text-2xl font-black text-slate-900 mt-1">S/ {totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Valor Proyectado Venta</span>
              <p className="text-2xl font-black text-martin-green-700 mt-1">S/ {totalSale.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Utilidad Bruta Proyectada</span>
              <p className="text-2xl font-black text-martin-orange-600 mt-1">S/ {estimatedMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU / Artículo</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-center">Stock Actual</th>
                    <th className="py-3 px-3 text-right">Costo Unit.</th>
                    <th className="py-3 px-3 text-right">Total Costo</th>
                    <th className="py-3 px-3 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-right">Margen Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{p.nombre}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">{p.categoriaNombre}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{p.stockActual}</td>
                      <td className="py-3 px-3 text-right text-slate-500">S/ {p.costoCompra.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">S/ {(p.stockActual * p.costoCompra).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-martin-green-700">S/ {p.precioVenta.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-martin-orange-600">
                        S/ {((p.precioVenta - p.costoCompra) * p.stockActual).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'REABASTECIMIENTO' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Artículo / SKU</th>
                  <th className="py-3 px-3">Proveedor Asignado</th>
                  <th className="py-3 px-3 text-center">Stock Actual</th>
                  <th className="py-3 px-3 text-center">Stock Mínimo</th>
                  <th className="py-3 px-3 text-center">Cantidad a Reordenar</th>
                  <th className="py-3 px-4 text-center">Ubicación Patio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Excelente: Ningún artículo se encuentra por debajo del umbral mínimo de existencias.
                    </td>
                  </tr>
                ) : (
                  lowStockAlerts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.nombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{p.proveedorNombre}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {p.stockActual} {p.unidadMedida}s
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-bold">{p.stockMinimo}</td>
                      <td className="py-3 px-3 text-center font-bold text-martin-green-700">
                        +{p.stockMaximo - p.stockActual} unidades
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-martin-orange-700">
                        {p.ubicacionCodigo}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'OCUPABILIDAD' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código Posición</th>
                  <th className="py-3 px-3">Zona & Pasillo</th>
                  <th className="py-3 px-3">Rack / Nivel</th>
                  <th className="py-3 px-3 text-right">Capacidad Máx. (Kg)</th>
                  <th className="py-3 px-3 text-right">Carga Actual (Kg)</th>
                  <th className="py-3 px-4 text-center">% Utilización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {locations.map(l => {
                  const prods = activeProducts.filter(p => p.ubicacionId === l.id);
                  const weight = prods.reduce((sum, p) => sum + (p.stockActual * p.pesoUnitarioKg), 0);
                  const percent = Math.min(100, Math.round((weight / l.capacidadCargaKg) * 100));

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{l.codigo}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">{l.zona} • Pasillo {l.pasillo}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">Rack {l.rack} / Nivel {l.nivel}</td>
                      <td className="py-3 px-3 text-right text-slate-500">{l.capacidadCargaKg.toLocaleString()} kg</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{weight.toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          percent > 85 ? 'bg-red-100 text-red-800' : 'bg-martin-green-100 text-martin-green-800'
                        }`}>
                          {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
