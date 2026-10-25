// Pruebas unitarias de movimientos y Kardex (src/models/MovementModel.js)
import { describe, it, expect } from 'vitest';
import { MovementModel, MovementType } from '../../src/models/MovementModel.js';

const producto = { id: 7, nombre: 'Plancha Drywall', sku: 'DRY-GYP-STD-12', stockActual: 10, costoCompra: 23.8 };

describe('MovementModel.isEntry / isExit', () => {
  it('clasifica entradas y salidas', () => {
    expect(MovementModel.isEntry(MovementType.ENTRADA_COMPRA)).toBe(true);
    expect(MovementModel.isEntry(MovementType.AJUSTE_POSITIVO)).toBe(true);
    expect(MovementModel.isExit(MovementType.SALIDA_VENTA)).toBe(true);
    expect(MovementModel.isExit(MovementType.MERMA)).toBe(true);
    expect(MovementModel.isExit(MovementType.AJUSTE_NEGATIVO)).toBe(true);
  });
});

describe('MovementModel.validate', () => {
  it('acepta una salida dentro del stock disponible', () => {
    expect(MovementModel.validate({ product: producto, tipo: 'SALIDA_VENTA', cantidad: 10, costoUnitario: 34.5 }).isValid).toBe(true);
  });

  it('rechaza una salida mayor al stock (control de negativos)', () => {
    const r = MovementModel.validate({ product: producto, tipo: 'MERMA', cantidad: 11, costoUnitario: 23.8 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/Stock insuficiente para salida/);
  });

  it('una entrada no depende del stock actual', () => {
    expect(MovementModel.validate({ product: producto, tipo: 'ENTRADA_COMPRA', cantidad: 500, costoUnitario: 20 }).isValid).toBe(true);
  });

  it('rechaza producto inexistente', () => {
    expect(MovementModel.validate({ product: null, tipo: 'SALIDA_VENTA', cantidad: 1, costoUnitario: 1 }).errors)
      .toEqual(['Producto no especificado o inexistente.']);
  });

  it.each([0, -1, 'abc'])('rechaza la cantidad %s', (cantidad) => {
    expect(MovementModel.validate({ product: producto, tipo: 'ENTRADA_COMPRA', cantidad, costoUnitario: 1 }).isValid).toBe(false);
  });

  // Caso de borde: el mensaje exige "número entero", así que 2.5 planchas no debe aceptarse
  it('rechaza una cantidad decimal', () => {
    expect(MovementModel.validate({ product: producto, tipo: 'SALIDA_VENTA', cantidad: 2.5, costoUnitario: 34.5 }).isValid).toBe(false);
  });

  it('rechaza un costo negativo', () => {
    expect(MovementModel.validate({ product: producto, tipo: 'ENTRADA_COMPRA', cantidad: 1, costoUnitario: -5 }).isValid).toBe(false);
  });

  // Caso de borde: un tipo que no es entrada ni salida no debe validarse como correcto
  it('rechaza un tipo de movimiento desconocido', () => {
    expect(MovementModel.validate({ product: producto, tipo: 'TRASLADO', cantidad: 50, costoUnitario: 1 }).isValid).toBe(false);
  });
});

describe('MovementModel.createMovementRecord y createKardexEntry', () => {
  it('una salida descuenta stock y calcula el total redondeado', () => {
    const { movement, newStock } = MovementModel.createMovementRecord({
      product: producto, tipo: 'SALIDA_VENTA', cantidad: 3, costoUnitario: 33.335, comprobante: 'B001-1'
    });
    expect(newStock).toBe(7);
    expect(movement).toMatchObject({ stockAnterior: 10, stockPosterior: 7, total: 100.01, comprobante: 'B001-1' });
  });

  it('usa el costo de compra del producto si no se indica costo', () => {
    const { movement } = MovementModel.createMovementRecord({ product: producto, tipo: 'MERMA', cantidad: 1 });
    expect(movement.costoUnitario).toBe(23.8);
    expect(movement.comprobante).toMatch(/^MOV-\d{6}$/);
    expect(movement.usuarioNombre).toBe('Sistema');
  });

  it('el asiento de Kardex de una salida solo llena las columnas de salida', () => {
    const { movement } = MovementModel.createMovementRecord({ product: producto, tipo: 'SALIDA_VENTA', cantidad: 2, costoUnitario: 10 });
    const k = MovementModel.createKardexEntry(movement);
    expect(k).toMatchObject({ cantEntrada: 0, totalEntrada: 0, cantSalida: 2, totalSalida: 20, cantSaldo: 8, totalSaldo: 80 });
  });

  it('el asiento de Kardex de una entrada solo llena las columnas de entrada', () => {
    const { movement } = MovementModel.createMovementRecord({ product: producto, tipo: 'ENTRADA_COMPRA', cantidad: 5, costoUnitario: 20 });
    const k = MovementModel.createKardexEntry(movement);
    expect(k).toMatchObject({ cantEntrada: 5, totalEntrada: 100, cantSalida: 0, cantSaldo: 15 });
  });
});
