import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  BookOpen,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Printer
} from 'lucide-react';

export const KardexView = () => {
  const { products, kardex } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState(() => {
    return products.length > 0 ? String(products[0].id) : '';
  });

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  // Filtrar renglones de Kardex para el producto seleccionado
  const productKardex = useMemo(() => {
    if (!selectedProductId) return [];
    return kardex
      .filter(k => k.productoId === Number(selectedProductId))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [kardex, selectedProductId]);

  // Totales acumulados
  const totalEntradasCant = productKardex.reduce((sum, k) => sum + k.cantEntrada, 0);
  const totalEntradasVal = productKardex.reduce((sum, k) => sum + k.totalEntrada, 0);
  const totalSalidasCant = productKardex.reduce((sum, k) => sum + k.cantSalida, 0);
  const totalSalidasVal = productKardex.reduce((sum, k) => sum + k.totalSalida, 0);

  const exportCSV = () => {
    if (productKardex.length === 0) return;
    const headers = ['Fecha', 'Tipo Operacion', 'Comprobante', 'Entrada Cant', 'Entrada Unit', 'Entrada Total', 'Salida Cant', 'Salida Unit', 'Salida Total', 'Saldo Cant', 'Costo Promedio', 'Saldo Total'];
    const rows = productKardex.map(k => [
      new Date(k.fecha).toLocaleString('es-PE'),
      k.tipoOperacion,
      k.comprobante,
      k.cantEntrada,
      Number(k.costoUnitEntrada || 0).toFixed(2),
      Number(k.totalEntrada || 0).toFixed(2),
      k.cantSalida,
      Number(k.costoUnitSalida || 0).toFixed(2),
      Number(k.totalSalida || 0).toFixed(2),
      k.cantSaldo,
      Number(k.costoPromedio || 0).toFixed(2),
      Number(k.totalSaldo || 0).toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kardex_${selectedProduct?.sku || 'Articulo'}.csv`);
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
            <span className="text-xs text-slate-500 font-semibold">Método Promedio Ponderado</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Control de Entradas y Salidas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control contable y físico de movimientos de existencias valorizados con costo promedio ponderado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={productKardex.length === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-martin-green-600" /> Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir Hoja
          </button>
        </div>
      </div>

      {/* Selector de Producto y Resumen */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Seleccione el Producto a Consultar:
          </label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full text-xs font-bold px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-white"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                [{p.sku}] {p.nombre} — Stock Actual: {p.stockActual} {p.unidadMedida}s (Costo: S/ {p.costoCompra.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Ubicación Patio:</span>
              <span className="font-bold text-martin-green-700 font-mono">{selectedProduct.ubicacionCodigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Saldo Físico Actual:</span>
              <span className="font-black text-slate-900">{selectedProduct.stockActual} {selectedProduct.unidadMedida}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Costo Unitario Vigente:</span>
              <span className="font-bold text-slate-800 font-mono">S/ {selectedProduct.costoCompra.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Valor Total en Custodia:</span>
              <span className="font-black text-martin-green-700 font-mono text-sm">
                S/ {(selectedProduct.stockActual * selectedProduct.costoCompra).toFixed(2)}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Tabla Oficial de Kardex Multicolumna */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            {/* Cabecera Agrupada de SUNAT */}
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-center border-b border-slate-800 text-[11px]">
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 uppercase tracking-wider">
                  Documento de Traslado / Operación
                </th>
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 bg-martin-green-900/60 uppercase tracking-wider text-martin-green-200">
                  Entradas (Compras / Ajustes +)
                </th>
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 bg-martin-orange-900/60 uppercase tracking-wider text-martin-orange-200">
                  Salidas (Ventas / Mermas)
                </th>
                <th colSpan={3} className="py-2.5 px-3 bg-slate-800 uppercase tracking-wider text-white">
                  Saldo Final en Custodia
                </th>
              </tr>

              <tr className="bg-slate-800 text-slate-300 font-semibold text-[10px] uppercase border-b border-slate-700">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-3 border-r border-slate-700">Comprobante</th>

                {/* Entradas */}
                <th className="py-2 px-2 text-right text-martin-green-300">Cant.</th>
                <th className="py-2 px-2 text-right text-martin-green-300">C. Unit</th>
                <th className="py-2 px-3 text-right text-martin-green-300 border-r border-slate-700 font-bold">Total</th>

                {/* Salidas */}
                <th className="py-2 px-2 text-right text-martin-orange-300">Cant.</th>
                <th className="py-2 px-2 text-right text-martin-orange-300">C. Unit</th>
                <th className="py-2 px-3 text-right text-martin-orange-300 border-r border-slate-700 font-bold">Total</th>

                {/* Saldos */}
                <th className="py-2 px-2 text-right text-white font-bold">Cant.</th>
                <th className="py-2 px-2 text-right text-white">C. Prom</th>
                <th className="py-2 px-3 text-right text-white font-bold">Total (S/)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {productKardex.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-sans">
                    No existen asientos de Kardex registrados para este artículo.
                  </td>
                </tr>
              ) : (
                productKardex.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Referencia */}
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(k.fecha).toLocaleDateString('es-PE')} {new Date(k.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-2 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        k.cantEntrada > 0 ? 'bg-martin-green-100 text-martin-green-800' : 'bg-martin-orange-100 text-martin-orange-800'
                      }`}>
                        {(k.tipoOperacion || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {k.comprobante}
                    </td>

                    {/* Entradas */}
                    <td className="py-3 px-2 text-right font-bold text-martin-green-700">
                      {k.cantEntrada > 0 ? `+${k.cantEntrada}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {k.cantEntrada > 0 ? Number(k.costoUnitEntrada || 0).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-martin-green-800 border-r border-slate-100">
                      {k.cantEntrada > 0 ? `S/ ${Number(k.totalEntrada || 0).toFixed(2)}` : '-'}
                    </td>

                    {/* Salidas */}
                    <td className="py-3 px-2 text-right font-bold text-martin-orange-600">
                      {k.cantSalida > 0 ? `-${k.cantSalida}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {k.cantSalida > 0 ? Number(k.costoUnitSalida || 0).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-martin-orange-700 border-r border-slate-100">
                      {k.cantSalida > 0 ? `S/ ${Number(k.totalSalida || 0).toFixed(2)}` : '-'}
                    </td>

                    {/* Saldos */}
                    <td className="py-3 px-2 text-right font-black text-slate-900 bg-slate-50/50">
                      {k.cantSaldo}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600 bg-slate-50/50">
                      {Number(k.costoPromedio || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 bg-slate-50/50">
                      S/ {Number(k.totalSaldo || 0).toFixed(2)}
                    </td>

                  </tr>
                ))
              )}
            </tbody>

            {/* Totales */}
            {productKardex.length > 0 && (
              <tfoot className="bg-slate-100 font-mono font-bold text-xs border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-sans uppercase">
                    Totales Acumulados:
                  </td>
                  <td className="py-3 px-2 text-right text-martin-green-700">+{totalEntradasCant}</td>
                  <td className="py-3 px-2 text-right">-</td>
                  <td className="py-3 px-3 text-right text-martin-green-800 border-r border-slate-300">
                    S/ {totalEntradasVal.toFixed(2)}
                  </td>

                  <td className="py-3 px-2 text-right text-martin-orange-600">-{totalSalidasCant}</td>
                  <td className="py-3 px-2 text-right">-</td>
                  <td className="py-3 px-3 text-right text-martin-orange-700 border-r border-slate-300">
                    S/ {totalSalidasVal.toFixed(2)}
                  </td>

                  <td colSpan={3} className="py-3 px-3 text-right text-slate-900 bg-slate-200/60 font-black">
                    Saldo Final: {selectedProduct?.stockActual} unid. (S/ {(selectedProduct?.stockActual * selectedProduct?.costoCompra).toFixed(2)})
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      </div>

    </div>
  );
};
