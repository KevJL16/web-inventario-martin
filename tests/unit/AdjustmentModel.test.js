// Pruebas unitarias de la validación previa en el navegador (src/models/AdjustmentModel.js)
import { describe, it, expect } from 'vitest';
import { AdjustmentModel, AdjustmentTypes, DETALLE_MIN } from '../../src/models/AdjustmentModel.js';
import { DETALLE_MIN as DETALLE_MIN_SERVIDOR } from '../../server/adjustmentRules.js';

const detalle = 'Rotura en la esquina superior por montacargas';

describe('AdjustmentModel.calculateNewStock', () => {
  it('descuenta en mermas y faltantes', () => {
    expect(AdjustmentModel.calculateNewStock(10, AdjustmentTypes.MERMA_DANO, 3)).toBe(7);
    expect(AdjustmentModel.calculateNewStock(10, AdjustmentTypes.FALTANTE, '4')).toBe(6);
  });

  it('suma en sobrantes', () => {
    expect(AdjustmentModel.calculateNewStock(10, AdjustmentTypes.SOBRANTE, 5)).toBe(15);
  });

  it('no modifica el stock con un tipo desconocido', () => {
    expect(AdjustmentModel.calculateNewStock(10, 'TRASLADO', 5)).toBe(10);
  });
});

describe('AdjustmentModel.validate (HU-004)', () => {
  it('acepta una merma válida con justificación', () => {
    expect(AdjustmentModel.validate(10, AdjustmentTypes.MERMA_DANO, 2, 'Rotura', detalle).isValid).toBe(true);
  });

  it('permite descontar exactamente todo el stock (valor límite)', () => {
    expect(AdjustmentModel.validate(5, AdjustmentTypes.MERMA_DANO, 5, 'Rotura', detalle).isValid).toBe(true);
  });

  it('impide descontar más del stock actual', () => {
    const r = AdjustmentModel.validate(1, AdjustmentTypes.FALTANTE, 2, 'Conteo', detalle);
    expect(r.isValid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/No se puede descontar más del stock actual \(1 unid\.\)/);
  });

  it('un sobrante no depende del stock actual', () => {
    expect(AdjustmentModel.validate(0, AdjustmentTypes.SOBRANTE, 50, 'Conteo', detalle).isValid).toBe(true);
  });

  it.each([0, -2, 1.5, NaN])('rechaza la cantidad %s', (qty) => {
    expect(AdjustmentModel.validate(10, AdjustmentTypes.MERMA_DANO, qty, 'Rotura', detalle).isValid).toBe(false);
  });

  it('exige motivo', () => {
    expect(AdjustmentModel.validate(10, AdjustmentTypes.MERMA_DANO, 1, '   ', detalle).errors)
      .toContain('El motivo de justificación es obligatorio (RF-20).');
  });

  it('exige una justificación técnica de longitud mínima', () => {
    expect(AdjustmentModel.validate(10, AdjustmentTypes.MERMA_DANO, 1, 'Rotura', '').isValid).toBe(false);
    expect(AdjustmentModel.validate(10, AdjustmentTypes.MERMA_DANO, 1, 'Rotura', 'corta').isValid).toBe(false);
  });

  it('rechaza un tipo de ajuste no válido', () => {
    expect(AdjustmentModel.validate(10, 'TRASLADO', 1, 'Rotura', detalle).isValid).toBe(false);
  });

  it('mantiene la misma longitud mínima de justificación que el servidor', () => {
    expect(DETALLE_MIN).toBe(DETALLE_MIN_SERVIDOR);
  });
});
