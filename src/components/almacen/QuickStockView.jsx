import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Zap,
  Search,
  Barcode,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Send
} from 'lucide-react';

export const QuickStockView = () => {
  const { products, registerMovement } = useInventory();
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickDispatchQty, setQuickDispatchQty] = useState('1');
  const [notification, setNotification] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Coincidencias rápidas
  const results = products.filter(p => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return (
      p.codigoBarras.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q)
    );
  });

  const handleSelect = (prod) => {
    setSelectedProduct(prod);
    setQuery('');
  };

  const handleQuickDispatch = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(quickDispatchQty);
    if (qty <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const res = registerMovement({
      productoId: selectedProduct.id,
      tipo: 'SALIDA_VENTA',
      cantidad: qty,
      costoUnitario: selectedProduct.costoCompra,
      comprobante: `VALE-ALM-${Date.now().toString().slice(-4)}`,
      observacion: 'Despacho rápido en mostrador de almacén'
    });

    if (res.success) {
      setNotification(`Despachadas ${qty} unidades de "${selectedProduct.nombre}". Stock restante: ${res.newStock}`);
      // Actualizar producto local
      setSelectedProduct(prev => ({ ...prev, stockActual: res.newStock }));
      setQuickDispatchQty('1');
      setTimeout(() => setNotification(null), 4000);
    } else {
      alert(res.message);
    }
  };

  // Simulación de escaneo de código de barras
  const simulateScan = (barcodeSample) => {
    setQuery(barcodeSample);
    const found = products.find(p => p.codigoBarras === barcodeSample);
    if (found) {
      setSelectedProduct(found);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Modo Terminal Almacén */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> RF-18: Vista Rápida para Almacenero
            </span>
            <span className="text-xs text-slate-400">Terminal Móvil / Tablet Almacén</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Consulta Rápida de Stock y Ubicación en Racks
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Búsqueda instantánea con lector de código de barras o teclado numérico para ubicación ágil en el patio.
          </p>
        </div>

        {/* Simulador de Pistola Láser de Código de Barras */}
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Barcode className="w-5 h-5 text-amber-400" />
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline">Escanear Demo:</span>
          <button
            onClick={() => simulateScan('7751234001015')}
            className="text-[11px] font-mono font-bold bg-slate-700 hover:bg-slate-600 text-amber-300 px-2 py-1 rounded transition-colors"
          >
            Melamina Roble 18mm
          </button>
          <button
            onClick={() => simulateScan('7751234002012')}
            className="text-[11px] font-mono font-bold bg-slate-700 hover:bg-slate-600 text-amber-300 px-2 py-1 rounded transition-colors"
          >
            Drywall Yeso 1/2"
          </button>
        </div>
      </div>

      {/* Notificación de éxito */}
      {notification && (
        <div className="bg-emerald-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Input Gigante de Consulta Rápida */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Pase el lector de código de barras o escriba código SKU / Nombre:
        </label>
        <div className="relative">
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Escanee EAN-13 o escriba ej: 'MEL-VES' o 'Roble'..."
            className="w-full pl-13 pr-4 py-4 text-base font-bold border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none bg-slate-50/50"
          />
        </div>

        {/* Desplegable de Resultados Rápidos */}
        {results.length > 0 && (
          <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
            {results.slice(0, 5).map(r => (
              <div
                key={r.id}
                onClick={() => handleSelect(r)}
                className="p-3.5 hover:bg-amber-50/60 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.nombre}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: <span className="text-slate-800 font-bold">{r.sku}</span> | EAN: {r.codigoBarras}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">
                    {r.ubicacionCodigo}
                  </span>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">
                    Stock: {r.stockActual} {r.unidadMedida}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ficha Visual del Producto Seleccionado (Optimizado para Almacenero) */}
      {selectedProduct ? (
        <div className="bg-white rounded-2xl border-2 border-amber-500 shadow-xl overflow-hidden animate-fade-in">
          
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
                {selectedProduct.categoriaNombre}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {selectedProduct.nombre}
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-1">
                SKU: <span className="text-white font-bold">{selectedProduct.sku}</span> • Código Barras: <span className="text-white font-bold">{selectedProduct.codigoBarras}</span>
              </p>
            </div>

            {/* Coordenada Exacta en Almacén Destacada */}
            <div className="bg-amber-600 text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 shrink-0">
              <MapPin className="w-7 h-7 shrink-0 text-amber-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Ubicación Rack</p>
                <p className="text-xl font-black font-mono tracking-tight">{selectedProduct.ubicacionCodigo}</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta de Stock Disponible */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Existencias Físicas</p>
              <p className="text-5xl font-black text-slate-900 my-2">
                {selectedProduct.stockActual}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {selectedProduct.unidadMedida}s disponibles para retiro
              </p>
              <div className="mt-3">
                {selectedProduct.stockActual === 0 ? (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-600 text-white">
                    AGOTADO EN ALMACÉN
                  </span>
                ) : selectedProduct.stockActual <= selectedProduct.stockMinimo ? (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    BAJO STOCK (MÍNIMO: {selectedProduct.stockMinimo})
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    STOCK NORMAL (MÍNIMO: {selectedProduct.stockMinimo})
                  </span>
                )}
              </div>
            </div>

            {/* Ficha de Características Físicas y Maniobra */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ficha de Maniobra y Peso</p>
              
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                <span className="text-slate-500">Marca / Fabricante:</span>
                <span className="font-bold text-slate-800">{selectedProduct.marca}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                <span className="text-slate-500">Espesor:</span>
                <span className="font-bold text-slate-800">{selectedProduct.espesorMm ? `${selectedProduct.espesorMm} mm` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                <span className="text-slate-500">Dimensiones de Plancha:</span>
                <span className="font-bold text-slate-800">{selectedProduct.dimensiones}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Peso Estimado:</span>
                <span className="font-bold text-amber-700">{selectedProduct.pesoUnitarioKg} kg / unid.</span>
              </div>
            </div>

            {/* Acción de Despacho Rápido */}
            <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Despacho Rápido en Patio
                </p>
                <p className="text-xs text-amber-800/80 mb-4">
                  Registra la salida física de almacén con actualización inmediata en el Kardex.
                </p>
                <form onSubmit={handleQuickDispatch} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cantidad a despachar ({selectedProduct.unidadMedida}s):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stockActual}
                      value={quickDispatchQty}
                      onChange={e => setQuickDispatchQty(e.target.value)}
                      className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={selectedProduct.stockActual <= 0}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Confirmar Entrega / Salida
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Barcode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600 text-sm">Escanee un artículo o selecciónelo desde el buscador superior.</p>
          <p className="text-xs text-slate-400 mt-1">La terminal mostrará su ubicación en estantería y stock disponible al instante.</p>
        </div>
      )}

    </div>
  );
};
