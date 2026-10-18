/**
 * CONTROLADOR: InventoryController
 * Capa de Lógica de Negocio y Orquestación para Inventario, Ventas, Entradas y Kardex.
 */

import { ProductModel } from '../models/ProductModel.js';
import { MovementModel, MovementType } from '../models/MovementModel.js';
import { AdjustmentModel, AdjustmentTypes } from '../models/AdjustmentModel.js';
import { OrderModel } from '../models/OrderModel.js';

export const InventoryController = {
  /**
   * RF-16: Registrar una Salida por Venta / Despacho
   * Descuenta stock, genera el asiento inmutable en movimientos y en el Kardex valorizado.
   */
  registerSale: ({
    productId,
    cantidad,
    precioVenta,
    comprobante,
    cliente,
    observacion,
    usuario,
    products,
    setProducts,
    setMovements,
    setKardex,
    logAction
  }) => {
    const product = products.find(p => p.id === Number(productId));
    if (!product) {
      return { success: false, message: 'Producto no encontrado en el catálogo activo.' };
    }

    // 1. Validar reglas de negocio con el modelo
    const validation = MovementModel.validate({
      product,
      tipo: MovementType.SALIDA_VENTA,
      cantidad,
      costoUnitario: precioVenta || product.precioVenta
    });

    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const docRef = comprobante?.trim() || `BV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const obsText = `Venta a cliente: ${cliente?.trim() || 'Público General'}. ${observacion?.trim() || ''}`.trim();

    // 2. Generar el registro de movimiento y nuevo stock
    const { movement, newStock } = MovementModel.createMovementRecord({
      product,
      tipo: MovementType.SALIDA_VENTA,
      cantidad,
      costoUnitario: precioVenta || product.precioVenta,
      comprobante: docRef,
      usuario,
      observacion: obsText
    });

    // 3. Generar el asiento en Kardex
    const kardexEntry = MovementModel.createKardexEntry(movement);

    // 4. Actualizar estado y persistencia
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stockActual: newStock } : p));
    setMovements(prev => [movement, ...prev]);
    setKardex(prev => [kardexEntry, ...prev]);

    // 5. Auditoría
    if (logAction) {
      logAction(
        'VENTA_REGISTRADA',
        'VENTAS',
        `Salida por Venta: ${cantidad} unid. de "${product.nombre}" (${product.sku}). Total: S/ ${movement.total.toFixed(2)}. Comprobante: ${docRef}`
      );
    }

    return {
      success: true,
      message: `Venta registrada con éxito. Comprobante ${docRef}. Nuevo stock: ${newStock} unidades.`,
      movement,
      newStock
    };
  },

  /**
   * RF-16: Registrar Movimiento General (Entrada, Salida, Merma, Ajuste)
   */
  registerMovement: ({
    productoId,
    tipo,
    cantidad,
    costoUnitario,
    comprobante,
    observacion,
    usuario,
    products,
    setProducts,
    setMovements,
    setKardex,
    logAction
  }) => {
    const product = products.find(p => p.id === Number(productoId));
    if (!product) return { success: false, message: 'Producto no encontrado.' };

    const validation = MovementModel.validate({
      product,
      tipo,
      cantidad,
      costoUnitario
    });

    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const { movement, newStock } = MovementModel.createMovementRecord({
      product,
      tipo,
      cantidad,
      costoUnitario,
      comprobante,
      usuario,
      observacion
    });

    const kardexEntry = MovementModel.createKardexEntry(movement);

    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stockActual: newStock } : p));
    setMovements(prev => [movement, ...prev]);
    setKardex(prev => [kardexEntry, ...prev]);

    if (logAction) {
      logAction(
        `MOVIMIENTO_${tipo}`,
        'INVENTARIO',
        `${tipo}: ${cantidad} unid. de "${product.nombre}". Saldo anterior: ${movement.stockAnterior} -> Nuevo: ${newStock}. Doc: ${movement.comprobante}`
      );
    }

    return { success: true, movement, newStock };
  },

  /**
   * RF-20: Registrar Ajuste de Stock Justificado (Mermas / Daños / Conteos)
   */
  registerAdjustment: ({
    productoId,
    tipoAjuste,
    cantidadAjuste,
    motivo,
    detalle,
    usuario,
    products,
    setProducts,
    setMovements,
    setKardex,
    setAdjustments,
    logAction
  }) => {
    const product = products.find(p => p.id === Number(productoId));
    if (!product) return { success: false, message: 'Producto no encontrado.' };

    const validation = AdjustmentModel.validate(product.stockActual, tipoAjuste, cantidadAjuste, motivo);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const qty = Number(cantidadAjuste);
    const folio = `AJU-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    let tipoMov = MovementType.MERMA;
    if (tipoAjuste === AdjustmentTypes.FALTANTE) tipoMov = MovementType.AJUSTE_NEGATIVO;
    if (tipoAjuste === AdjustmentTypes.SOBRANTE) tipoMov = MovementType.AJUSTE_POSITIVO;

    const newStock = AdjustmentModel.calculateNewStock(product.stockActual, tipoAjuste, qty);

    const adjustmentRecord = {
      id: Date.now(),
      numeroAjuste: folio,
      productoId: product.id,
      productoNombre: product.nombre,
      sku: product.sku,
      tipoAjuste,
      cantidadAjustada: qty,
      stockTeorico: product.stockActual,
      stockFisico: newStock,
      costoUnitario: product.costoCompra,
      impactoEconomico: Math.round(qty * product.costoCompra * 100) / 100,
      motivo: motivo.trim(),
      detalle: detalle?.trim() || '',
      responsable: usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Encargado de Almacén',
      fecha: new Date().toISOString()
    };

    setAdjustments(prev => [adjustmentRecord, ...prev]);

    // Asentar en movimientos y Kardex
    return InventoryController.registerMovement({
      productoId: product.id,
      tipo: tipoMov,
      cantidad: qty,
      costoUnitario: product.costoCompra,
      comprobante: folio,
      observacion: `[Ajuste de Stock] Motivo: ${motivo}. Detalle: ${detalle || 'Sin detalle'}`,
      usuario,
      products,
      setProducts,
      setMovements,
      setKardex,
      logAction
    });
  },

  /**
   * RF-05: Crear Producto
   */
  createProduct: ({ prodData, categories, locations, suppliers, setProducts, logAction }) => {
    const validation = ProductModel.validate(prodData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const cat = categories.find(c => c.id === Number(prodData.categoriaId)) || categories[0];
    const loc = locations.find(l => l.id === Number(prodData.ubicacionId)) || locations[0];
    const sup = suppliers.find(s => s.id === Number(prodData.proveedorId)) || suppliers[0];

    const newProduct = ProductModel.create(prodData, cat, loc, sup);
    setProducts(prev => [newProduct, ...prev]);

    if (logAction) {
      logAction(
        'ALTA_PRODUCTO',
        'CATALOGO',
        `Creación de "${newProduct.nombre}" (SKU: ${newProduct.sku}) con stock inicial ${newProduct.stockActual}`
      );
    }

    return { success: true, product: newProduct };
  },

  /**
   * RF-06: Modificar Producto
   */
  updateProduct: ({ id, prodData, categories, locations, suppliers, setProducts, logAction }) => {
    const validation = ProductModel.validate(prodData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    const cat = categories.find(c => c.id === Number(prodData.categoriaId)) || categories[0];
    const loc = locations.find(l => l.id === Number(prodData.ubicacionId)) || locations[0];
    const sup = suppliers.find(s => s.id === Number(prodData.proveedorId)) || suppliers[0];

    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        sku: prodData.sku.trim().toUpperCase(),
        codigoBarras: prodData.codigoBarras.trim(),
        nombre: prodData.nombre.trim(),
        descripcion: prodData.descripcion?.trim() || '',
        categoriaId: cat.id,
        categoriaNombre: cat.nombre,
        marca: prodData.marca.trim(),
        espesorMm: prodData.espesorMm ? Number(prodData.espesorMm) : null,
        dimensiones: prodData.dimensiones?.trim() || 'Estándar',
        unidadMedida: prodData.unidadMedida,
        pesoUnitarioKg: Number(prodData.pesoUnitarioKg) || 15.0,
        precioVenta: Number(prodData.precioVenta),
        costoCompra: Number(prodData.costoCompra),
        stockMinimo: Number(prodData.stockMinimo) || 10,
        stockMaximo: Number(prodData.stockMaximo) || 100,
        ubicacionId: loc.id,
        ubicacionCodigo: loc.codigo,
        proveedorId: sup.id,
        proveedorNombre: sup.razonSocial,
        modificadoEn: new Date().toISOString()
      };
    }));

    if (logAction) {
      logAction('EDICION_PRODUCTO', 'CATALOGO', `Actualización de ficha técnica de "${prodData.nombre}" (SKU: ${prodData.sku})`);
    }

    return { success: true };
  },

  /**
   * RF-07: Baja Lógica de Producto
   */
  deleteProduct: ({ id, products, setProducts, logAction }) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return { success: false, message: 'Producto no encontrado.' };

    setProducts(prev => prev.map(p => p.id === id ? { ...p, activo: false } : p));

    if (logAction) {
      logAction('BAJA_PRODUCTO', 'CATALOGO', `Baja lógica (retiro del catálogo activo) de "${prod.nombre}" (SKU: ${prod.sku})`);
    }

    return { success: true };
  }
};
