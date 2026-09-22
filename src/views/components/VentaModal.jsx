import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  ShoppingCart, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  User, 
  Package, 
  Building2,
  TrendingDown,
  FileCheck
} from 'lucide-react';

export const VentaModal = ({ isOpen, onClose, initialProductId = null }) => {
  const { products, registerSale } = useInventory();

  // Filtrar solo productos activos
  const activeProducts = products.filter(p => p.activo);

  const [selectedId, setSelectedId] = useState(
    initialProductId ? String(initialProductId) : (activeProducts[0] ? String(activeProducts[0].id) : '')
  );
  const [cantidad, setCantidad] = useState('1');
  const [precioVenta, setPrecioVenta] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('BOLETA');
  const [comprobante, setComprobante] = useState('');
  const [cliente, setCliente] = useState('Público General');
  const [observacion, setObservacion] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar al abrir o cambiar initialProductId
  useEffect(() => {
    if (initialProductId) {
      setSelectedId(String(initialProductId));
    } else if (activeProducts.length > 0 && !selectedId) {
      setSelectedId(String(activeProducts[0].id));
    }
  }, [initialProductId, isOpen]);

  // Actualizar precio y comprobante al cambiar producto o tipo de comprobante
  useEffect(() => {
    const prod = activeProducts.find(p => p.id === Number(selectedId));
    if (prod) {
      setPrecioVenta(String(prod.precioVenta));
    }

    const prefix = tipoComprobante === 'FACTURA' ? 'F001' : tipoComprobante === 'BOLETA' ? 'B001' : 'VAL';
    const correlativo = Math.floor(10000 + Math.random() * 90000);
    setComprobante(`${prefix}-${correlativo}`);
    setErrorMessage('');
  }, [selectedId, tipoComprobante]);

  if (!isOpen) return null;

  const currentProduct = activeProducts.find(p => p.id === Number(selectedId));
  const qtyNumber = Number(cantidad) || 0;
  const priceNumber = Number(precioVenta) || 0;
  const subtotal = Math.round(qtyNumber * priceNumber * 100) / 100;
  const stockRestante = currentProduct ? currentProduct.stockActual - qtyNumber : 0;
  const isOutOfStock = currentProduct ? currentProduct.stockActual <= 0 : true;
  const isInsufficient = currentProduct ? currentProduct.stockActual < qtyNumber : true;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentProduct) {
      setErrorMessage('Seleccione un producto válido.');
      return;
    }

    if (qtyNumber <= 0) {
      setErrorMessage('La cantidad a vender debe ser mayor a 0.');
      return;
    }

    if (isInsufficient) {
      setErrorMessage(`Stock insuficiente. Solo hay ${currentProduct.stockActual} unidades disponibles en almacén.`);
      return;
    }

    const res = registerSale({
      productId: currentProduct.id,
      cantidad: qtyNumber,
      precioVenta: priceNumber,
      comprobante: comprobante.trim(),
      cliente: cliente.trim(),
      observacion: observacion.trim()
    });

    if (res.success) {
      setSuccessData({
        comprobante: res.movement.comprobante,
        cantidad: qtyNumber,
        producto: currentProduct.nombre,
        total: res.movement.total,
        newStock: res.newStock
      });
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Cabecera Verde Corporativo Minimalista */}
        <div className="bg-martin-green-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-martin-orange-500 text-white px-2 py-0.5 rounded">
                  Salida por Venta
                </span>
                <span className="text-xs text-martin-green-100 font-medium">Despacho Inmediato</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Registrar Venta de Producto
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pantalla de Éxito al Completar Venta */}
        {successData ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-martin-green-100 text-martin-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Se ha descontado del inventario físico y asentado en el Kardex y movimientos.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">N° Comprobante:</span>
                <span className="font-mono font-bold text-slate-900">{successData.comprobante}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Artículo Vendido:</span>
                <span className="font-bold text-slate-800">{successData.producto}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Cantidad Despachada:</span>
                <span className="font-black text-martin-orange-600">{successData.cantidad} unidades</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Total Venta:</span>
                <span className="font-black text-martin-green-700 text-sm">S/ {successData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Nuevo Stock en Almacén:</span>
                <span className="font-bold text-slate-900">{successData.newStock} unidades</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setSuccessData(null)}
                className="px-5 py-2.5 bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                + Registrar Otra Venta
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Selector de Producto */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Producto a Despachar *</span>
                {currentProduct && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isOutOfStock
                      ? 'bg-red-100 text-red-700'
                      : currentProduct.stockActual <= currentProduct.stockMinimo
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-martin-green-100 text-martin-green-800'
                  }`}>
                    Stock disponible: {currentProduct.stockActual} {currentProduct.unidadMedida}s
                  </span>
                )}
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20 bg-white"
              >
                {activeProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.nombre} — Stock: {p.stockActual} | S/ {p.precioVenta.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Ficha rápida del producto seleccionado */}
            {currentProduct && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{currentProduct.nombre}</p>
                  <p className="text-[11px] text-slate-500">
                    SKU: <span className="font-mono font-bold text-slate-700">{currentProduct.sku}</span> | Ubicación: <span className="font-bold text-martin-orange-600">{currentProduct.ubicacionCodigo}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Precio Lista</span>
                  <span className="font-black text-slate-900 text-sm">S/ {currentProduct.precioVenta.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* 2. Cantidad y Precio de Venta */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cantidad a Vender *
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentProduct ? currentProduct.stockActual : undefined}
                  required
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Unitario Venta (S/) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={precioVenta}
                  onChange={e => setPrecioVenta(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20"
                />
              </div>
            </div>

            {/* 3. Tipo y N° Comprobante */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo Comprobante
                </label>
                <select
                  value={tipoComprobante}
                  onChange={e => setTipoComprobante(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20 bg-white"
                >
                  <option value="BOLETA">Boleta Electrónica</option>
                  <option value="FACTURA">Factura Electrónica</option>
                  <option value="VALE">Vale de Salida / Despacho</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Comprobante *
                </label>
                <input
                  type="text"
                  required
                  value={comprobante}
                  onChange={e => setComprobante(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20"
                  placeholder="B001-12345"
                />
              </div>
            </div>

            {/* 4. Cliente y Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente / Razón Social
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20"
                  placeholder="Nombre o RUC del cliente"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observación de Despacho
                </label>
                <input
                  type="text"
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-martin-green-500 focus:ring-2 focus:ring-martin-green-500/20"
                  placeholder="Piso, camión o referencia"
                />
              </div>
            </div>

            {/* 5. Resumen de Liquidación de la Salida */}
            <div className="p-3.5 bg-martin-orange-50/70 border border-martin-orange-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-martin-orange-800">
                  Resumen de Operación:
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Stock posterior proyectado: <strong className={stockRestante < 0 ? 'text-red-600' : 'text-slate-900'}>{stockRestante}</strong> unidades
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total a Cobrar</span>
                <p className="text-xl font-black text-martin-green-700">
                  S/ {subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isInsufficient || isOutOfStock}
                className="px-5 py-2.5 bg-martin-green-500 hover:bg-martin-green-600 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                Confirmar Venta y Descontar Stock
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
