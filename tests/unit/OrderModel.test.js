// Pruebas unitarias de órdenes de compra (src/models/OrderModel.js)
import { describe, it, expect } from 'vitest';
import { OrderModel } from '../../src/models/OrderModel.js';

describe('OrderModel.calculateTotals', () => {
  it('calcula subtotal, IGV (18 %) y total', () => {
    expect(OrderModel.calculateTotals([{ cantidad: 10, costoUnitario: 122 }, { cantidad: 2, costoUnitario: 50 }]))
      .toEqual({ subtotal: 1320, igv: 237.6, total: 1557.6 });
  });

  it('una orden vacía suma 0', () => {
    expect(OrderModel.calculateTotals([])).toEqual({ subtotal: 0, igv: 0, total: 0 });
  });

  // Caso de borde: errores de coma flotante en importes de dinero
  it('redondea el subtotal a céntimos', () => {
    expect(OrderModel.calculateTotals([{ cantidad: 3, costoUnitario: 0.1 }]).subtotal).toBe(0.3);
  });
});

describe('OrderModel.validate', () => {
  it('exige proveedor y al menos un producto', () => {
    expect(OrderModel.validate({}).errors).toHaveLength(2);
    expect(OrderModel.validate({ proveedorId: 1, items: [{}] }).isValid).toBe(true);
  });
});
