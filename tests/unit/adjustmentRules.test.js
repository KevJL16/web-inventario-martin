// Pruebas unitarias de las reglas de negocio de HU-004 (server/adjustmentRules.js)
import { describe, it, expect } from 'vitest';
import {
  validateAdjustmentInput,
  ADJUSTMENT_TYPES,
  ADJUSTMENT_ROLES,
  DETALLE_MIN,
  DETALLE_MAX,
  MOTIVO_MAX,
  CANTIDAD_MAX
} from '../../server/adjustmentRules.js';

const valido = {
  productoId: 1,
  tipoAjuste: 'MERMA_DANO',
  cantidad: 2,
  motivo: 'Tablero desportillado',
  detalle: 'Golpe de montacargas durante la descarga del lote'
};

describe('validateAdjustmentInput (HU-004)', () => {
  it('acepta un ajuste completo y válido', () => {
    const r = validateAdjustmentInput(valido);
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('normaliza el tipo a mayúsculas y recorta espacios del motivo y la justificación', () => {
    const r = validateAdjustmentInput({ ...valido, tipoAjuste: ' sobrante ', motivo: '  Conteo  ', detalle: '  Conteo físico con 3 unidades más  ' });
    expect(r.isValid).toBe(true);
    expect(r.value).toMatchObject({ tipoAjuste: 'SOBRANTE', motivo: 'Conteo', detalle: 'Conteo físico con 3 unidades más' });
  });

  it('acepta la cantidad enviada como texto numérico y como cantidadAjuste', () => {
    expect(validateAdjustmentInput({ ...valido, cantidad: '5' }).value.cantidad).toBe(5);
    const { cantidad, ...sinCantidad } = valido;
    expect(validateAdjustmentInput({ ...sinCantidad, cantidadAjuste: 3 }).value.cantidad).toBe(3);
  });

  it.each(ADJUSTMENT_TYPES)('acepta el tipo %s', (tipo) => {
    expect(validateAdjustmentInput({ ...valido, tipoAjuste: tipo }).isValid).toBe(true);
  });

  it.each([undefined, null, '', 'MERMA', 'TRASLADO', 5])('rechaza el tipo de ajuste %s', (tipo) => {
    const r = validateAdjustmentInput({ ...valido, tipoAjuste: tipo });
    expect(r.isValid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/Tipo de ajuste no válido/);
  });

  it.each([0, -1, 2.5, 'abc', '', '   ', null, undefined, NaN, Infinity])('rechaza la cantidad %s', (cantidad) => {
    const r = validateAdjustmentInput({ ...valido, cantidad });
    expect(r.isValid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/entero mayor a 0/);
  });

  it('acepta la cantidad máxima permitida y rechaza la siguiente (valor límite)', () => {
    expect(validateAdjustmentInput({ ...valido, cantidad: CANTIDAD_MAX }).isValid).toBe(true);
    const r = validateAdjustmentInput({ ...valido, cantidad: CANTIDAD_MAX + 1 });
    expect(r.isValid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/no puede superar/);
  });

  it.each([0, -3, 1.5, 'x', null])('rechaza el producto %s', (productoId) => {
    const r = validateAdjustmentInput({ ...valido, productoId });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Seleccione un producto válido.');
  });

  it.each(['', '   ', null, undefined, 123])('exige el motivo (valor %s)', (motivo) => {
    const r = validateAdjustmentInput({ ...valido, motivo });
    expect(r.errors).toContain('El motivo del ajuste es obligatorio.');
  });

  it('rechaza un motivo más largo que el permitido por la columna de la BD', () => {
    expect(validateAdjustmentInput({ ...valido, motivo: 'm'.repeat(MOTIVO_MAX) }).isValid).toBe(true);
    expect(validateAdjustmentInput({ ...valido, motivo: 'm'.repeat(MOTIVO_MAX + 1) }).isValid).toBe(false);
  });

  it.each(['', '    ', null, undefined])('exige la justificación técnica (valor %s)', (detalle) => {
    const r = validateAdjustmentInput({ ...valido, detalle });
    expect(r.errors).toContain('La justificación técnica es obligatoria.');
  });

  it('aplica los límites de longitud de la justificación (valores límite)', () => {
    expect(validateAdjustmentInput({ ...valido, detalle: 'd'.repeat(DETALLE_MIN - 1) }).isValid).toBe(false);
    expect(validateAdjustmentInput({ ...valido, detalle: 'd'.repeat(DETALLE_MIN) }).isValid).toBe(true);
    expect(validateAdjustmentInput({ ...valido, detalle: 'd'.repeat(DETALLE_MAX) }).isValid).toBe(true);
    expect(validateAdjustmentInput({ ...valido, detalle: 'd'.repeat(DETALLE_MAX + 1) }).isValid).toBe(false);
  });

  it('cuenta la longitud de la justificación sin los espacios de los extremos', () => {
    const r = validateAdjustmentInput({ ...valido, detalle: `   ${'d'.repeat(DETALLE_MIN - 1)}   ` });
    expect(r.isValid).toBe(false);
  });

  it.each([undefined, null, 'texto', 42])('no falla con un cuerpo de petición inválido (%s)', (body) => {
    const r = validateAdjustmentInput(body);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBe(5);
  });

  it('solo autoriza a Administrador y Encargado de Almacén a registrar ajustes', () => {
    expect(ADJUSTMENT_ROLES).toEqual(['Administrador', 'Encargado de Almacén']);
    expect(ADJUSTMENT_ROLES).not.toContain('Gerencia');
  });
});
