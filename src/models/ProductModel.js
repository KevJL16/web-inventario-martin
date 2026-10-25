/**
 * MODELO: ProductModel
 * Entidad Producto, validación de reglas de negocio y cálculo de márgenes y criticidad.
 */

export const StockStatus = {
  AGOTADO: 'AGOTADO',
  CRITICO: 'CRITICO',
  BAJO: 'BAJO',
  NORMAL: 'NORMAL',
  SOBRESTOCK: 'SOBRESTOCK'
};

// Convierte a número; vacío, null o undefined se tratan como no numéricos
const toNumber = (value) => (value === '' || value === null || value === undefined ? NaN : Number(value));

export const ProductModel = {
  /**
   * Calcula el estado de salud del stock de un producto
   */
  getStockStatus: (stockActual, stockMinimo, stockMaximo) => {
    const stock = Number(stockActual) || 0;
    const min = Number(stockMinimo) || 10;
    const max = Number(stockMaximo) || 100;

    if (stock <= 0) return StockStatus.AGOTADO;
    if (stock <= Math.max(1, Math.floor(min * 0.5))) return StockStatus.CRITICO;
    if (stock <= min) return StockStatus.BAJO;
    if (stock > max) return StockStatus.SOBRESTOCK;
    return StockStatus.NORMAL;
  },

  /**
   * Calcula el margen bruto comercial en porcentaje
   */
  calculateMargin: (costoCompra, precioVenta) => {
    const costo = Number(costoCompra) || 0;
    const precio = Number(precioVenta) || 0;
    if (precio <= 0) return 0;
    return Math.round(((precio - costo) / precio) * 100 * 10) / 10;
  },

  /**
   * Valida los datos obligatorios de un producto antes de persistir
   */
  validate: (data) => {
    const errors = [];
    if (!data.sku || !data.sku.trim()) errors.push('El SKU es obligatorio.');
    if (!data.nombre || !data.nombre.trim()) errors.push('El nombre del producto es obligatorio.');
    if (!data.codigoBarras || !data.codigoBarras.trim()) errors.push('El código de barras es obligatorio.');
    // Number('abc') es NaN y toda comparación con NaN es falsa: se valida que sean números
    const precio = toNumber(data.precioVenta);
    const costo = toNumber(data.costoCompra);
    const minimo = toNumber(data.stockMinimo);
    const maximo = toNumber(data.stockMaximo);

    if (!Number.isFinite(precio) || precio <= 0) errors.push('El precio de venta debe ser mayor a 0.');
    if (!Number.isFinite(costo) || costo < 0) errors.push('El costo de compra debe ser un número mayor o igual a 0.');
    if (Number.isFinite(precio) && Number.isFinite(costo) && precio < costo) {
      errors.push('El precio de venta no puede ser inferior al costo de compra.');
    }
    if (!Number.isInteger(minimo) || minimo < 1) errors.push('El stock mínimo debe ser un número entero de al menos 1.');
    if (!Number.isInteger(maximo) || !Number.isInteger(minimo) || maximo <= minimo) {
      errors.push('El stock máximo debe ser un número entero mayor al stock mínimo.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Crea un nuevo registro de producto sanitizado
   */
  create: (data, category, location, supplier) => {
    return {
      id: Date.now(),
      sku: data.sku.trim().toUpperCase(),
      codigoBarras: data.codigoBarras.trim(),
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || '',
      categoriaId: category.id,
      categoriaNombre: category.nombre,
      marca: data.marca?.trim() || 'Genérico',
      espesorMm: data.espesorMm ? Number(data.espesorMm) : null,
      dimensiones: data.dimensiones?.trim() || 'Estándar',
      unidadMedida: data.unidadMedida || 'Plancha',
      pesoUnitarioKg: Number(data.pesoUnitarioKg) || 15.0,
      precioVenta: Number(data.precioVenta),
      costoCompra: Number(data.costoCompra),
      stockActual: Number(data.stockActual) || 0,
      stockMinimo: Number(data.stockMinimo) || 10,
      stockMaximo: Number(data.stockMaximo) || 100,
      ubicacionId: location.id,
      ubicacionCodigo: location.codigo,
      clasificacionABC: data.clasificacionABC || 'B',
      proveedorId: supplier.id,
      proveedorNombre: supplier.razonSocial,
      activo: true,
      creadoEn: new Date().toISOString()
    };
  }
};
