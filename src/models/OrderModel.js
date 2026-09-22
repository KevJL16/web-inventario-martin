/**
 * MODELO: OrderModel
 * Entidad Orden de Compra a Proveedores y cálculo de impuestos (RF-13).
 */

export const OrderModel = {
  calculateTotals: (items) => {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad) * Number(it.costoUnitario)), 0);
    const igv = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + igv) * 100) / 100;
    return { subtotal, igv, total };
  },

  validate: (orderData) => {
    const errors = [];
    if (!orderData.proveedorId) errors.push('Debe seleccionar un proveedor.');
    if (!orderData.items || orderData.items.length === 0) errors.push('La orden debe contener al menos un producto.');
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
