import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
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
  const { products, locations, movements, lowStockAlerts } = useInventory();
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
      headers = ['Codigo Ubicacion', 'Zona', 'Pasillo', 'Rack', 'Nivel', 'Tipo Mercaderia', 'Capacidad Kg', 'Carga Actual Kg', '% Ocupabilidad'];
      rows = locations.map(l => {
        const prods = activeProducts.filter(p => p.ubicacionId === l.id);
        const weight = prods.reduce((sum, p) => sum + (p.stockActual * p.pesoUnitarioKg), 0);
        const pct = Math.min(100, Math.round((weight / l.capacidadKg) * 100));
        return [l.codigo, l.zona, l.pasillo, l.rack, l.nivel, `"${l.tipo}"`, l.capacidadKg, weight, `${pct}%`];
      });
      fileName = 'Reporte_Ocupabilidad_Almacen.csv';
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-11
            </span>
            <span className="text-xs text-slate-500 font-medium">Información Ejecutiva y Analítica</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Centro de Emisión de Reportes Financieros y Operativos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Valorización de activos madereros, alertas de stock mínimo y volumetría de estibas pesadas para la alta dirección.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-amber-900/20"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setReportType('VALORIZADO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            reportType === 'VALORIZADO'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Valorización Contable de Inventario
        </button>
        <button
          onClick={() => setReportType('REABASTECIMIENTO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            reportType === 'REABASTECIMIENTO'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          Necesidades de Reabastecimiento Crítico
        </button>
        <button
          onClick={() => setReportType('OCUPABILIDAD')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            reportType === 'OCUPABILIDAD'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          Ocupabilidad y Carga de Racks
        </button>
      </div>

      {/* 1. Reporte Valorizado de Inventario */}
      {reportType === 'VALORIZADO' && (
        <div className="space-y-4">
          
          {/* Tarjetas de Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Valorización Total al Costo</span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                S/ {totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Capital en mercadería física</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Valorización a Precio Venta</span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                S/ {totalSale.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Retorno bruto estimado</p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-800 uppercase">Margen Comercial Proyectado</span>
              <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                S/ {estimatedMargin.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-bold">
                {totalCost > 0 ? ((estimatedMargin / totalCost) * 100).toFixed(1) : 0}% margen sobre costo
              </p>
            </div>
          </div>

          {/* Tabla Detallada */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-sans">
                  <tr>
                    <th className="py-3 px-4">SKU / Artículo</th>
                    <th className="py-3 px-3">Familia</th>
                    <th className="py-3 px-3 text-center">Stock Físico</th>
                    <th className="py-3 px-3 text-right">Costo Unit.</th>
                    <th className="py-3 px-3 text-right">Valor Total Costo</th>
                    <th className="py-3 px-3 text-right">Precio Venta</th>
                    <th className="py-3 px-3 text-right">Valor Total Venta</th>
                    <th className="py-3 px-4 text-right">Margen Potencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProducts.map(p => {
                    const costVal = p.stockActual * p.costoCompra;
                    const saleVal = p.stockActual * p.precioVenta;
                    const margin = saleVal - costVal;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-sans">
                          <p className="font-bold text-slate-900">{p.nombre}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-600">{p.categoriaNombre}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">{p.stockActual}</td>
                        <td className="py-3 px-3 text-right text-slate-600">S/ {p.costoCompra.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">S/ {costVal.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-slate-600">S/ {p.precioVenta.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">S/ {saleVal.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">S/ {margin.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. Reporte de Reabastecimiento */}
      {reportType === 'REABASTECIMIENTO' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Artículos en o por debajo del umbral de reorden ({lowStockAlerts.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-3 text-center">Stock Actual</th>
                  <th className="py-3 px-3 text-center">Stock Mínimo</th>
                  <th className="py-3 px-3 text-center">Sugerido a Reordenar</th>
                  <th className="py-3 px-3">Proveedor Homologado</th>
                  <th className="py-3 px-4">Ubicación Rack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockAlerts.map(p => (
                  <tr key={p.id} className="hover:bg-red-50/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.nombre}</p>
                      <p className="text-[10px] font-mono text-slate-500">{p.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-red-600">{p.stockActual}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{p.stockMinimo}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50">
                      +{p.stockMaximo - p.stockActual} unid.
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.proveedorNombre}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">{p.ubicacionCodigo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Reporte de Ocupabilidad Física */}
      {reportType === 'OCUPABILIDAD' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código Posición</th>
                  <th className="py-3 px-3">Zona / Tipo</th>
                  <th className="py-3 px-3 text-center">Pasillo / Rack</th>
                  <th className="py-3 px-3 text-right">Carga Actual</th>
                  <th className="py-3 px-3 text-right">Capacidad Máx.</th>
                  <th className="py-3 px-4 text-center">% Ocupación Estructural</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map(l => {
                  const prods = activeProducts.filter(p => p.ubicacionId === l.id);
                  const weight = prods.reduce((sum, p) => sum + (p.stockActual * p.pesoUnitarioKg), 0);
                  const pct = Math.min(100, Math.round((weight / l.capacidadKg) * 100));

                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">{l.codigo}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{l.zona} • {l.tipo}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">{l.pasillo} / {l.rack} ({l.nivel})</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{weight.toLocaleString()} kg</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{l.capacidadKg.toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          pct > 85 ? 'bg-red-100 text-red-800' : pct > 60 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {pct}%
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
