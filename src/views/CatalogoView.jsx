import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
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
  EyeOff,
  ShoppingCart
} from 'lucide-react';
import { ProductModal } from '../components/catalogo/ProductModal';
import { VentaModal } from './components/VentaModal';

export const CatalogoView = () => {
  const { products, categories, deleteProduct } = useInventory();
  const { isAdmin, isAlmacenero, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, NORMAL, LOW_STOCK, OUT_OF_STOCK
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Estado del Modal de Ventas (RF-16)
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [ventaProductTarget, setVentaProductTarget] = useState(null);

  // Permisos según RBAC (RF-04)
  const canManageProducts = isAdmin || isAlmacenero;

  // Filtrado y búsqueda reactiva (RF-08)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigoBarras.includes(searchTerm) ||
        p.marca.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || p.categoriaId === Number(selectedCategory);

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

  const handleVenta = (prod) => {
    setVentaProductTarget(prod.id);
    setVentaModalOpen(true);
  };

  const handleDelete = (id, nombre) => {
    if (window.confirm(`¿Confirmas la baja lógica del producto "${nombre}"? El historial de movimientos y Kardex se preservará intacto.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo con Colores Martín */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-semibold">Control de Existencias y Maderas</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Catálogo de Productos y Existencias
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de tableros de melamina, planchas de drywall, pisos flotantes y herrajes de Representaciones Martín.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botón Acción Rápida: Registrar Venta (Solo Admin y Vendedor) */}
          {['Administrador', 'Vendedor'].includes(currentUser?.rolNombre) && (
            <button
              onClick={() => {
                setVentaProductTarget(null);
                setVentaModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-martin-orange-500 hover:bg-martin-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Registrar una venta rápida de cualquier producto"
            >
              <ShoppingCart className="w-4 h-4" /> Registrar Venta
            </button>
          )}

          {canManageProducts && (
            <button
              onClick={handleCreate}
              className="px-4 py-2.5 rounded-xl bg-martin-green-500 hover:bg-martin-green-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda Rápida */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por SKU, nombre, marca o código de barras..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-martin-green-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Filtros de Categoría y Stock */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas ({products.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Stock:</span>
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todos los estados</option>
                <option value="NORMAL">Normal / Abastecido</option>
                <option value="LOW_STOCK">Stock Crítico (Bajo)</option>
                <option value="OUT_OF_STOCK">Agotado (0 unidades)</option>
              </select>
            </div>

          </div>

        </div>

      </div>

      {/* Tabla Principal de Catálogo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Artículo / Especificación</th>
                <th className="py-3 px-3">Categoría & Marca</th>
                <th className="py-3 px-3">Ubicación Rack</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-center">Existencias</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron artículos con los filtros aplicados.</p>
                    <p className="text-[11px] mt-1">Pruebe modificando el término de búsqueda o cambiando de categoría.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isAgotado = prod.stockActual === 0;
                  const isBajoStock = prod.stockActual <= prod.stockMinimo && !isAgotado;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Nombre y SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{prod.nombre}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            {prod.sku}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {prod.dimensiones} {prod.espesorMm ? `• ${prod.espesorMm}mm` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Categoría & Marca */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{prod.categoriaNombre}</div>
                        <div className="text-[11px] text-slate-500">{prod.marca}</div>
                      </td>

                      {/* Ubicación */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-martin-green-700 bg-martin-green-50 px-2 py-0.5 rounded-lg border border-martin-green-200">
                          <MapPin className="w-3.5 h-3.5 text-martin-green-600" />
                          <span>{prod.ubicacionCodigo}</span>
                        </div>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{prod.pesoUnitarioKg} kg / unid.</span>
                      </td>

                      {/* Costo / Venta */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-slate-900 text-sm">S/ {prod.precioVenta.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Costo: S/ {prod.costoCompra.toFixed(2)}</div>
                      </td>

                      {/* Nivel de Stock y Alertas (RF-09, RF-10) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            isAgotado
                              ? 'bg-red-600 text-white animate-pulse'
                              : isBajoStock
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-martin-green-100 text-martin-green-800'
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-martin-green-700 bg-martin-green-50 px-2 py-0.5 rounded-full border border-martin-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            <EyeOff className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Botón Directo: Vender / Despachar (Solo Admin y Vendedor) */}
                          {['Administrador', 'Vendedor'].includes(currentUser?.rolNombre) && prod.activo && (
                            <button
                              onClick={() => handleVenta(prod)}
                              disabled={prod.stockActual <= 0}
                              className="px-2.5 py-1 rounded-lg bg-martin-green-50 hover:bg-martin-green-100 text-martin-green-700 disabled:opacity-40 disabled:hover:bg-martin-green-50 transition-colors flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                              title="Registrar salida o venta directa de este producto"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Vender</span>
                            </button>
                          )}

                          {canManageProducts && (
                            <>
                              <button
                                onClick={() => handleEdit(prod)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-martin-green-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Editar información del producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              {isAdmin && prod.activo && (
                                <button
                                  onClick={() => handleDelete(prod.id, prod.nombre)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Retirar del catálogo activo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
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

      {/* Modal Dedicado de Registro de Venta (RF-16) */}
      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
        initialProductId={ventaProductTarget}
      />

    </div>
  );
};
