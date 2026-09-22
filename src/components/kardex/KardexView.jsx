import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
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
      k.costoUnitEntrada.toFixed(2),
      k.totalEntrada.toFixed(2),
      k.cantSalida,
      k.costoUnitSalida.toFixed(2),
      k.totalSalida.toFixed(2),
      k.cantSaldo,
      k.costoPromedio.toFixed(2),
      k.totalSaldo.toFixed(2)
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-17
            </span>
            <span className="text-xs text-slate-500 font-medium">Libro Mayor de Existencias (Valuado)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Kardex Histórico Físico-Valorizado (Promedio Ponderado)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría contable y trazabilidad inmutable de entradas, salidas y saldos monetarios por artículo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-amber-900/20"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Selector de Producto y Resumen de Ficha */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Seleccione el Artículo a Consultar:
            </label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.nombre} — Stock: {p.stockActual} {p.unidadMedida}s
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase">{selectedProduct.categoriaNombre}</span>
                <p className="font-bold text-slate-900">{selectedProduct.nombre}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ubicación: <span className="font-mono text-slate-700 font-bold">{selectedProduct.ubicacionCodigo}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Saldo Actual</span>
                <p className="text-xl font-black text-slate-900">
                  {selectedProduct.stockActual} <span className="text-xs font-medium text-slate-500">{selectedProduct.unidadMedida}s</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Totales Resumen del Kardex */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Entradas</span>
            <p className="text-lg font-black text-emerald-900 mt-0.5">+{totalEntradasCant} unid.</p>
            <p className="text-[11px] text-emerald-700 font-mono">S/ {totalEntradasVal.toFixed(2)}</p>
          </div>
          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-800 uppercase">Total Salidas</span>
            <p className="text-lg font-black text-rose-900 mt-0.5">-{totalSalidasCant} unid.</p>
            <p className="text-[11px] text-rose-700 font-mono">S/ {totalSalidasVal.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
            <span className="text-[10px] font-bold text-amber-800 uppercase">Saldo Existencias</span>
            <p className="text-lg font-black text-amber-900 mt-0.5">{selectedProduct?.stockActual || 0} unid.</p>
            <p className="text-[11px] text-amber-700 font-mono">
              S/ {((selectedProduct?.stockActual || 0) * (selectedProduct?.costoCompra || 0)).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase">Costo Ponderado</span>
            <p className="text-lg font-black text-slate-900 mt-0.5 font-mono">
              S/ {selectedProduct?.costoCompra.toFixed(2) || '0.00'}
            </p>
            <p className="text-[11px] text-slate-500">Por {selectedProduct?.unidadMedida || 'unidad'}</p>
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Kardex Físico-Valorizado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Encabezados Agrupados Oficiales */}
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider text-center">
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-left">Documento de Traslado</th>
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 bg-emerald-950/80 text-emerald-200">Entradas (Ingresos)</th>
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 bg-rose-950/80 text-rose-200">Salidas (Egresos)</th>
                <th colSpan={3} className="py-2.5 px-3 bg-amber-950/80 text-amber-200">Saldo Final en Almacén</th>
              </tr>
              <tr className="bg-slate-800 text-slate-300 font-bold uppercase text-[10px] border-b border-slate-700">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Comprobante</th>
                <th className="py-2 px-3 border-r border-slate-700">Operación</th>
                
                {/* Entradas */}
                <th className="py-2 px-2 text-center">Cant.</th>
                <th className="py-2 px-2 text-right">C. Unit</th>
                <th className="py-2 px-3 text-right border-r border-slate-700">Total</th>

                {/* Salidas */}
                <th className="py-2 px-2 text-center">Cant.</th>
                <th className="py-2 px-2 text-right">C. Unit</th>
                <th className="py-2 px-3 text-right border-r border-slate-700">Total</th>

                {/* Saldo */}
                <th className="py-2 px-2 text-center">Cant.</th>
                <th className="py-2 px-2 text-right">C. Prom</th>
                <th className="py-2 px-3 text-right">Saldo Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {productKardex.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500 font-sans">
                    No hay movimientos registrados en Kardex para este artículo.
                  </td>
                </tr>
              ) : (
                productKardex.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {new Date(k.fecha).toLocaleDateString('es-PE')} {new Date(k.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{k.comprobante}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {k.tipoOperacion}
                      </span>
                    </td>

                    {/* Entradas */}
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                      {k.cantEntrada > 0 ? `+${k.cantEntrada}` : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {k.cantEntrada > 0 ? k.costoUnitEntrada.toFixed(2) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800 border-r border-slate-200">
                      {k.cantEntrada > 0 ? k.totalEntrada.toFixed(2) : '-'}
                    </td>

                    {/* Salidas */}
                    <td className="py-2.5 px-2 text-center font-bold text-rose-700">
                      {k.cantSalida > 0 ? `-${k.cantSalida}` : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {k.cantSalida > 0 ? k.costoUnitSalida.toFixed(2) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-800 border-r border-slate-200">
                      {k.cantSalida > 0 ? k.totalSalida.toFixed(2) : '-'}
                    </td>

                    {/* Saldo */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-amber-50/40">
                      {k.cantSaldo}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 bg-amber-50/40">
                      {k.costoPromedio.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/70">
                      S/ {k.totalSaldo.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
