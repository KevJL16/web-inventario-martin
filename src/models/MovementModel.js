/**
 * MODELO: MovementModel
 * Entidad Movimiento de Almacén y Asiento de Kardex Valorizado (SUNAT).
 */

export const MovementType = {
  ENTRADA_COMPRA: 'ENTRADA_COMPRA',
  SALIDA_VENTA: 'SALIDA_VENTA',
  MERMA: 'MERMA',
  AJUSTE_POSITIVO: 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO: 'AJUSTE_NEGATIVO'
};

export const MovementModel = {
  /**
   * Determina si el tipo de movimiento incrementa o decrementa stock
   */
  isEntry: (tipo) => ['ENTRADA_COMPRA', 'AJUSTE_POSITIVO'].includes(tipo),
  isExit: (tipo) => ['SALIDA_VENTA', 'AJUSTE_NEGATIVO', 'MERMA'].includes(tipo),

  /**
   * Valida una transacción de movimiento
   */
  validate: ({ product, tipo, cantidad, costoUnitario }) => {
    const errors = [];
    if (!product) {
      errors.push('Producto no especificado o inexistente.');
      return { isValid: false, errors };
    }

    const qty = Number(cantidad);
    if (isNaN(qty) || qty <= 0) {
      errors.push('La cantidad debe ser un número entero mayor a 0.');
    }

    const cost = Number(costoUnitario);
    if (isNaN(cost) || cost < 0) {
      errors.push('El costo o precio unitario no puede ser negativo.');
    }

    if (MovementModel.isExit(tipo)) {
      if (product.stockActual < qty) {
        errors.push(
          `Stock insuficiente para salida. Stock actual en almacén: ${product.stockActual} unidades, solicitado: ${qty}.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Genera el registro de movimiento inmutable (RF-16)
   */
  createMovementRecord: ({ product, tipo, cantidad, costoUnitario, comprobante, usuario, observacion }) => {
    const qty = Number(cantidad);
    const cost = Number(costoUnitario || product.costoCompra);
    const stockAnterior = product.stockActual;
    const isEntry = MovementModel.isEntry(tipo);
    const stockPosterior = isEntry ? stockAnterior + qty : stockAnterior - qty;

    const movement = {
      id: Date.now(),
      productoId: product.id,
      productoNombre: product.nombre,
      sku: product.sku,
      tipo,
      cantidad: qty,
      stockAnterior,
      stockPosterior,
      costoUnitario: cost,
      total: Math.round(qty * cost * 100) / 100,
      comprobante: comprobante || `MOV-${Date.now().toString().slice(-6)}`,
      usuarioId: usuario?.id || 1,
      usuarioNombre: usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Sistema',
      fecha: new Date().toISOString(),
      observacion: observacion || ''
    };

    return {
      movement,
      newStock: stockPosterior
    };
  },

  /**
   * Genera el asiento contable de Kardex Físico-Valorizado (RF-17)
   */
  createKardexEntry: (movement) => {
    const isEntry = MovementModel.isEntry(movement.tipo);
    const isExit = MovementModel.isExit(movement.tipo);

    return {
      id: Date.now() + 1,
      productoId: movement.productoId,
      fecha: movement.fecha,
      tipoOperacion: movement.tipo,
      comprobante: movement.comprobante,
      cantEntrada: isEntry ? movement.cantidad : 0,
      costoUnitEntrada: isEntry ? movement.costoUnitario : 0,
      totalEntrada: isEntry ? movement.total : 0,
      cantSalida: isExit ? movement.cantidad : 0,
      costoUnitSalida: isExit ? movement.costoUnitario : 0,
      totalSalida: isExit ? movement.total : 0,
      cantSaldo: movement.stockPosterior,
      costoPromedio: movement.costoUnitario,
      totalSaldo: Math.round(movement.stockPosterior * movement.costoUnitario * 100) / 100
    };
  }
};
