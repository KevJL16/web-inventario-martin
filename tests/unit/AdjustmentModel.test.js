// Pruebas unitarias de la validación previa en el navegador (src/models/AdjustmentModel.js)
// PC 12: actualizadas tras la refactorización (reglas únicas en shared/adjustmentRules.js)
import { describe, it, expect } from 'vitest';
import {
  AdjustmentModel,
  AdjustmentTypes,
  DETALLE_MIN,
  toHistoryRow,
  filterAdjustments
} from '../../src/models/AdjustmentModel.js';
import {
  DETALLE_MIN as DETALLE_MIN_SERVIDOR,
  DETALLE_MAX,
  MOTIVO_MAX,
  CANTIDAD_MAX,
  validateAdjustmentInput
} from '../../server/adjustmentRules.js';

const detalle = 'Rotura en la esquina superior por montacargas';
const producto = (stockActual) => ({ id: 7, stockActual });
const datos = (overrides = {}) => ({
  producto: producto(10),
  tipoAjuste: AdjustmentTypes.MERMA_DANO,
  cantidad: 2,
  motivo: 'Rotura',
  detalle,
  ...overrides
});

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
    expect(AdjustmentModel.validate(datos()).isValid).toBe(true);
  });

  it('acepta la cantidad escrita como texto en el formulario', () => {
    expect(AdjustmentModel.validate(datos({ cantidad: '2' })).isValid).toBe(true);
  });

  it('permite descontar exactamente todo el stock (valor límite)', () => {
    expect(AdjustmentModel.validate(datos({ producto: producto(5), cantidad: 5 })).isValid).toBe(true);
  });

  it('impide descontar más del stock actual', () => {
    const r = AdjustmentModel.validate(datos({ producto: producto(1), tipoAjuste: AdjustmentTypes.FALTANTE, cantidad: 2 }));
    expect(r.isValid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/No se puede descontar más del stock actual \(1 unid\.\)/);
  });

  it('un sobrante no depende del stock actual', () => {
    expect(AdjustmentModel.validate(datos({ producto: producto(0), tipoAjuste: AdjustmentTypes.SOBRANTE, cantidad: 50 })).isValid).toBe(true);
  });

  it('exige seleccionar un producto', () => {
    const r = AdjustmentModel.validate(datos({ producto: undefined }));
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Seleccione un producto válido.');
  });

  it.each([0, -2, 1.5, NaN, ''])('rechaza la cantidad %s', (cantidad) => {
    expect(AdjustmentModel.validate(datos({ cantidad })).isValid).toBe(false);
  });

  it('no muestra el error de stock cuando la cantidad ya es inválida', () => {
    const r = AdjustmentModel.validate(datos({ producto: producto(1), cantidad: -5 }));
    expect(r.errors.some((e) => e.includes('stock actual'))).toBe(false);
  });

  it('exige motivo', () => {
    expect(AdjustmentModel.validate(datos({ motivo: '   ' })).errors).toContain('El motivo del ajuste es obligatorio.');
  });

  it('exige una justificación técnica de longitud mínima', () => {
    expect(AdjustmentModel.validate(datos({ detalle: '' })).isValid).toBe(false);
    expect(AdjustmentModel.validate(datos({ detalle: 'corta' })).isValid).toBe(false);
  });

  it('rechaza un tipo de ajuste no válido', () => {
    expect(AdjustmentModel.validate(datos({ tipoAjuste: 'TRASLADO' })).isValid).toBe(false);
  });

  it('mantiene la misma longitud mínima de justificación que el servidor', () => {
    expect(DETALLE_MIN).toBe(DETALLE_MIN_SERVIDOR);
  });
});

// PC 12 — DEF-15: el navegador aceptaba datos que la API rechazaba (máximos no validados)
describe('Paridad navegador / servidor (DEF-15)', () => {
  const escenarios = [
    ['justificación de 500 caracteres (límite)', { detalle: 'x'.repeat(DETALLE_MAX) }],
    ['justificación de 501 caracteres', { detalle: 'x'.repeat(DETALLE_MAX + 1) }],
    ['motivo de 100 caracteres (límite)', { motivo: 'm'.repeat(MOTIVO_MAX) }],
    ['motivo de 101 caracteres', { motivo: 'm'.repeat(MOTIVO_MAX + 1) }],
    ['sobrante de 100000 unidades (límite)', { tipoAjuste: 'SOBRANTE', cantidad: CANTIDAD_MAX }],
    ['sobrante de 100001 unidades', { tipoAjuste: 'SOBRANTE', cantidad: CANTIDAD_MAX + 1 }],
    ['justificación solo con espacios', { detalle: '          ' }],
    ['tipo en minúsculas', { tipoAjuste: 'merma_dano' }]
  ];

  it.each(escenarios)('%s: navegador y servidor dan el mismo resultado', (_nombre, cambios) => {
    const entrada = datos({ producto: producto(CANTIDAD_MAX + 10), ...cambios });
    const navegador = AdjustmentModel.validate(entrada);
    const servidor = validateAdjustmentInput({ ...entrada, productoId: entrada.producto.id });
    expect(navegador.isValid).toBe(servidor.isValid);
    expect(navegador.errors).toEqual(servidor.errors);
  });
});

// PC 12 — DEF-16: el historial no debe inventar datos cuando faltan
describe('toHistoryRow', () => {
  const ajusteApi = {
    id: 3,
    numeroAjuste: 'AJU-2026-00003',
    productoNombre: 'Tablero Melamina Vesto Roble Cendra 18mm',
    sku: 'MEL-VES-ROB-18',
    tipoAjuste: 'MERMA_DANO',
    cantidadAjustada: 2,
    costoUnitario: 122,
    impactoEconomico: 244,
    motivo: 'Rotura',
    detalle: detalle,
    responsable: 'Jorge Luis Paredes Soto',
    fecha: '2026-10-24T05:06:08.750Z'
  };

  it('convierte un ajuste completo de la API', () => {
    const fila = toHistoryRow(ajusteApi);
    expect(fila).toMatchObject({
      id: 3,
      folio: 'AJU-2026-00003',
      sku: 'MEL-VES-ROB-18',
      tipo: 'MERMA_DANO',
      cantidad: 2,
      impacto: 244,
      responsable: 'Jorge Luis Paredes Soto'
    });
    expect(fila.fecha).toBeInstanceOf(Date);
  });

  it('calcula el impacto con cantidad × costo si la API no lo envía', () => {
    expect(toHistoryRow({ ...ajusteApi, impactoEconomico: undefined }).impacto).toBe(244);
  });

  it('deja en null los datos faltantes en vez de inventarlos', () => {
    const fila = toHistoryRow({ id: 9 });
    expect(fila).toMatchObject({
      folio: null,
      fecha: null,
      sku: null,
      tipo: null,
      cantidad: null,
      impacto: null,
      responsable: null
    });
  });

  it('descarta una fecha inválida', () => {
    expect(toHistoryRow({ ...ajusteApi, fecha: 'no-es-fecha' }).fecha).toBeNull();
  });

  it('tolera un ajuste nulo', () => {
    expect(toHistoryRow(null).folio).toBeNull();
  });
});

describe('filterAdjustments', () => {
  const lista = [
    { numeroAjuste: 'AJU-2026-00001', productoNombre: 'Plancha Drywall Gyplac', motivo: 'Humedad' },
    { numeroAjuste: 'AJU-2026-00002', productoNombre: 'Tablero Melamina Vesto', motivo: 'Rotura por estiba' },
    { numeroAjuste: null, productoNombre: null, motivo: null }
  ];

  it('devuelve todo con el término vacío o solo con espacios', () => {
    expect(filterAdjustments(lista, '')).toHaveLength(3);
    expect(filterAdjustments(lista, '   ')).toHaveLength(3);
  });

  it('busca por folio, producto y motivo sin distinguir mayúsculas', () => {
    expect(filterAdjustments(lista, 'aju-2026-00002')).toHaveLength(1);
    expect(filterAdjustments(lista, 'DRYWALL')).toHaveLength(1);
    expect(filterAdjustments(lista, 'estiba')).toHaveLength(1);
  });

  it('no falla con campos nulos ni con una lista inexistente', () => {
    expect(filterAdjustments(lista, 'zzz')).toHaveLength(0);
    expect(filterAdjustments(undefined, 'x')).toEqual([]);
  });
});
