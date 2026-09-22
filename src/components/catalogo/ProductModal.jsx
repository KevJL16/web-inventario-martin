import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Save, Package, Layers, MapPin, DollarSign, Scale } from 'lucide-react';

export const ProductModal = ({ isOpen, onClose, productToEdit }) => {
  const { categories, locations, suppliers, addProduct, updateProduct } = useInventory();

  const [formData, setFormData] = useState({
    sku: '',
    codigoBarras: '',
    nombre: '',
    descripcion: '',
    categoriaId: '1',
    marca: 'Vesto / Arauco',
    espesorMm: '18',
    dimensiones: '2.15 x 2.44 m',
    unidadMedida: 'Plancha',
    pesoUnitarioKg: '42.5',
    precioVenta: '',
    costoCompra: '',
    stockActual: '0',
    stockMinimo: '15',
    stockMaximo: '120',
    ubicacionId: '1',
    proveedorId: '1'
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        sku: productToEdit.sku,
        codigoBarras: productToEdit.codigoBarras,
        nombre: productToEdit.nombre,
        descripcion: productToEdit.descripcion || '',
        categoriaId: String(productToEdit.categoriaId),
        marca: productToEdit.marca,
        espesorMm: String(productToEdit.espesorMm || ''),
        dimensiones: productToEdit.dimensiones || '',
        unidadMedida: productToEdit.unidadMedida,
        pesoUnitarioKg: String(productToEdit.pesoUnitarioKg || '15'),
        precioVenta: String(productToEdit.precioVenta),
        costoCompra: String(productToEdit.costoCompra),
        stockActual: String(productToEdit.stockActual),
        stockMinimo: String(productToEdit.stockMinimo),
        stockMaximo: String(productToEdit.stockMaximo),
        ubicacionId: String(productToEdit.ubicacionId),
        proveedorId: String(productToEdit.proveedorId || '1')
      });
    } else {
      // Valores por defecto para nuevo producto
      setFormData({
        sku: 'MEL-NUE-' + Math.floor(100 + Math.random() * 900),
        codigoBarras: '775' + Math.floor(1000000000 + Math.random() * 9000000000),
        nombre: '',
        descripcion: '',
        categoriaId: '1',
        marca: 'Pelíkano',
        espesorMm: '18',
        dimensiones: '2.15 x 2.44 m',
        unidadMedida: 'Plancha',
        pesoUnitarioKg: '42.5',
        precioVenta: '150.00',
        costoCompra: '110.00',
        stockActual: '20',
        stockMinimo: '10',
        stockMaximo: '100',
        ubicacionId: '1',
        proveedorId: '1'
      });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.sku || !formData.precioVenta || !formData.costoCompra) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, formData);
    } else {
      addProduct(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Header del Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {productToEdit ? 'Modificar Información de Producto' : 'Registrar Nuevo Producto en Catálogo'}
              </h3>
              <p className="text-xs text-slate-400">
                Rubro Maderero: Tableros de Melamina, Drywall, Pisos y Herrajes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Identificación Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="MEL-VES-001"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras *</label>
              <input
                type="text"
                required
                value={formData.codigoBarras}
                onChange={e => setFormData({ ...formData, codigoBarras: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="7751234567890"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Familia / Categoría *</label>
              <select
                value={formData.categoriaId}
                onChange={e => setFormData({ ...formData, categoriaId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre y Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial del Producto *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Ej. Tablero Melamina Pelíkano Roble Cendra 18mm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Técnica / Usos</label>
            <textarea
              rows={2}
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Especificaciones de acabado, resistencia a humedad, tratamiento antibacteriano..."
            />
          </div>

          {/* Especificaciones Madereras y Físicas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Marca / Fabricante</label>
              <input
                type="text"
                value={formData.marca}
                onChange={e => setFormData({ ...formData, marca: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Vesto / Gyplac"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Espesor (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.espesorMm}
                onChange={e => setFormData({ ...formData, espesorMm: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="18"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Dimensiones</label>
              <input
                type="text"
                value={formData.dimensiones}
                onChange={e => setFormData({ ...formData, dimensiones: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="2.15 x 2.44 m"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Unidad de Medida</label>
              <select
                value={formData.unidadMedida}
                onChange={e => setFormData({ ...formData, unidadMedida: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Plancha">Plancha</option>
                <option value="Caja">Caja (m²)</option>
                <option value="Unidad">Unidad</option>
                <option value="Par">Par</option>
                <option value="Bolsa">Bolsa</option>
              </select>
            </div>
          </div>

          {/* Precios y Costos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Costo de Compra (S/) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costoCompra}
                onChange={e => setFormData({ ...formData, costoCompra: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="110.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio de Venta (S/) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precioVenta}
                onChange={e => setFormData({ ...formData, precioVenta: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="150.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peso Unitario (Kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.pesoUnitarioKg}
                onChange={e => setFormData({ ...formData, pesoUnitarioKg: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="42.5"
              />
            </div>
          </div>

          {/* Control de Stock y Umbrales (RF-09, RF-10) */}
          <div className="grid grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {productToEdit ? 'Stock Actual' : 'Stock Inicial'}
              </label>
              <input
                type="number"
                disabled={!!productToEdit}
                value={formData.stockActual}
                onChange={e => setFormData({ ...formData, stockActual: e.target.value })}
                className={`w-full text-xs px-2.5 py-1.5 border rounded-md ${productToEdit ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
              />
              {productToEdit && <p className="text-[10px] text-slate-400 mt-0.5">Ajustable vía movimientos</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-rose-700 mb-1">Stock Mínimo (Alerta) *</label>
              <input
                type="number"
                required
                value={formData.stockMinimo}
                onChange={e => setFormData({ ...formData, stockMinimo: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-rose-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Stock Máximo</label>
              <input
                type="number"
                value={formData.stockMaximo}
                onChange={e => setFormData({ ...formData, stockMaximo: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Ubicación Física y Proveedor (RF-12, RF-13) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ubicación Almacén (Zona-Pasillo-Rack-Nivel) *
              </label>
              <select
                value={formData.ubicacionId}
                onChange={e => setFormData({ ...formData, ubicacionId: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.codigo} ({l.tipo})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor Principal *</label>
              <select
                value={formData.proveedorId}
                onChange={e => setFormData({ ...formData, proveedorId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.razonSocial}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-martin-green-500 hover:bg-martin-green-600 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {productToEdit ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
