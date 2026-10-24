// Pruebas unitarias del catálogo (src/models/ProductModel.js)
import { describe, it, expect } from 'vitest';
import { ProductModel, StockStatus } from '../../src/models/ProductModel.js';

const valido = {
  sku: 'mel-18-bl',
  codigoBarras: '7751234001099',
  nombre: 'Melamina Blanca',
  precioVenta: 185,
  costoCompra: 120,
  stockMinimo: 10,
  stockMaximo: 100
};

describe('ProductModel.validate', () => {
  it('acepta un producto válido', () => {
    expect(ProductModel.validate(valido).isValid).toBe(true);
  });

  it.each(['sku', 'nombre', 'codigoBarras'])('exige el campo %s (vacío o solo espacios)', (campo) => {
    expect(ProductModel.validate({ ...valido, [campo]: '   ' }).isValid).toBe(false);
  });

  it('rechaza un precio de venta 0 o inferior al costo', () => {
    expect(ProductModel.validate({ ...valido, precioVenta: 0 }).isValid).toBe(false);
    expect(ProductModel.validate({ ...valido, precioVenta: 119.99 }).isValid).toBe(false);
  });

  it('acepta un precio igual al costo (valor límite)', () => {
    expect(ProductModel.validate({ ...valido, precioVenta: 120 }).isValid).toBe(true);
  });

  it('exige stock máximo mayor que el mínimo', () => {
    expect(ProductModel.validate({ ...valido, stockMaximo: 10 }).isValid).toBe(false);
    expect(ProductModel.validate({ ...valido, stockMaximo: 11 }).isValid).toBe(true);
  });

  // Casos de borde: valores no numéricos en campos numéricos del formulario
  it.each([
    ['precioVenta', 'abc'],
    ['costoCompra', 'abc'],
    ['stockMinimo', 'diez'],
    ['stockMaximo', undefined]
  ])('rechaza %s no numérico (%s)', (campo, valor) => {
    expect(ProductModel.validate({ ...valido, [campo]: valor }).isValid).toBe(false);
  });
});

describe('ProductModel.getStockStatus', () => {
  it.each([
    [0, StockStatus.AGOTADO],
    [5, StockStatus.CRITICO],
    [10, StockStatus.BAJO],
    [50, StockStatus.NORMAL],
    [101, StockStatus.SOBRESTOCK]
  ])('stock %i con mínimo 10 y máximo 100 es %s', (stock, estado) => {
    expect(ProductModel.getStockStatus(stock, 10, 100)).toBe(estado);
  });

  it('CP-11: el producto de prueba (stock 10, mínimo 15) queda en estado bajo', () => {
    expect(ProductModel.getStockStatus(10, 15, 200)).toBe(StockStatus.BAJO);
  });
});

describe('ProductModel.calculateMargin', () => {
  it('calcula el margen bruto con un decimal', () => {
    expect(ProductModel.calculateMargin(120, 185)).toBe(35.1);
  });

  it('devuelve 0 si el precio es 0', () => {
    expect(ProductModel.calculateMargin(120, 0)).toBe(0);
  });
});
