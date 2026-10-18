import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import { ProductModal } from './ProductModal';

export const CatalogoView = ({ openAdjustmentModal, openMovementModal }) => {
  const { products, categories, deleteProduct } = useInventory();
  const { isAdmin, isAlmacenero } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, NORMAL, LOW_STOCK, OUT_OF_STOCK
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Permisos según RBAC (RF-04)
  const canManageProducts = isAdmin || isAlmacenero;

  // Filtrado y búsqueda reactiva (RF-08)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Búsqueda por texto (SKU, nombre, marca o código de barras)
      const matchesSearch = 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigoBarras.includes(searchTerm) ||
        p.marca.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de categoría
      const matchesCat = selectedCategory === 'ALL' || p.categoriaId === Number(selectedCategory);

      // Filtro por nivel de stock (RF-09, RF-10)
      let matchesStock = true;
      if (stockFilter === 'NORMAL') {
        matchesStock = p.stockActual > p.stockMinimo;
      } else if (stockFilter === 'LOW_STOCK') {
        matchesStock = p.stockActual <= p.stockMinimo && p.stockActual > 0;
      } else if (stockFilter === 'OUT_OF_STOCK') {
        matchesStock = p.stockActual === 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleDelete = (id, nombre) => {
    if (window.confirm(`¿Confirmas la baja lógica del producto "${nombre}"? El historial de movimientos y Kardex se preservará intacto.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              RF-05 / RF-06 / RF-07 / RF-08
            </span>
            <span className="text-xs text-slate-500 font-medium">Catálogo Maestro</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Catálogo de Productos Madereros y Construcción
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión técnica y comercial de tableros de melamina, planchas de drywall, pisos flotantes y herrajes.
          </p>
        </div>

        {canManageProducts && (
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Ingresar Nuevo Producto (RF-05)
          </button>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda Rápida (RF-08) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por SKU, nombre, marca o código de barras..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Filtro de Estado de Stock (RF-09 / RF-10) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Stock:
            </span>
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                stockFilter === 'LOW_STOCK' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Bajo Stock
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stockFilter === 'OUT_OF_STOCK' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              Agotados
            </button>
          </div>
        </div>

        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las familias
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === String(cat.id)
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

      </div>

      {/* Tabla de Productos del Catálogo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Producto & Especificaciones</th>
                <th className="py-3.5 px-3">Familia / Categoría</th>
                <th className="py-3.5 px-3">Ubicación Rack (RF-12)</th>
                <th className="py-3.5 px-3 text-right">Costo / Venta</th>
                <th className="py-3.5 px-3 text-center">Nivel Stock (RF-09/10)</th>
                <th className="py-3.5 px-3 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No se encontraron productos con los filtros seleccionados.</p>
                    <p className="text-xs text-slate-400 mt-1">Intenta ajustando el término de búsqueda o la categoría.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isAgotado = prod.stockActual === 0;
                  const isBajoStock = prod.stockActual <= prod.stockMinimo && !isAgotado;
                  const isNormal = prod.stockActual > prod.stockMinimo;

                  return (
                    <tr key={prod.id} className={`hover:bg-slate-50/80 transition-colors ${!prod.activo ? 'opacity-50 bg-slate-100/50' : ''}`}>
                      
                      {/* Producto & Especificaciones */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{prod.nombre}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{prod.sku}</span>
                          <span>EAN: {prod.codigoBarras}</span>
                        </div>
                        <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                          {prod.marca} {prod.espesorMm ? `• ${prod.espesorMm}mm` : ''} {prod.dimensiones ? `• ${prod.dimensiones}` : ''} ({prod.unidadMedida})
                        </div>
                      </td>

                      {/* Familia */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {prod.categoriaNombre}
                        </span>
                      </td>

                      {/* Ubicación Física (RF-12) */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{prod.ubicacionCodigo}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{prod.pesoUnitarioKg} kg / unid.</span>
                      </td>

                      {/* Costo / Venta */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-slate-900">S/ {prod.precioVenta.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Costo: S/ {prod.costoCompra.toFixed(2)}</div>
                      </td>

                      {/* Nivel de Stock y Alertas (RF-09, RF-10) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            isAgotado
                              ? 'bg-red-700 text-white animate-pulse'
                              : isBajoStock
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {prod.stockActual} {prod.unidadMedida}s
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Mín: {prod.stockMinimo} | Máx: {prod.stockMaximo}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3 text-center">
                        {prod.activo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            <EyeOff className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {canManageProducts ? (
                            <>
                              <button
                                onClick={() => handleEdit(prod)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Editar información del producto (RF-06)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              {isAdmin && prod.activo && (
                                <button
                                  onClick={() => handleDelete(prod.id, prod.nombre)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Retirar del catálogo activo (RF-07)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Solo lectura</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productToEdit={editingProduct}
      />

    </div>
  );
};
