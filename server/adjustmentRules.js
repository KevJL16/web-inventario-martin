// ============================================================================
// REGLAS DE NEGOCIO DE AJUSTES Y MERMAS (HU-004 / RF-20)
// Módulo puro, sin dependencias de base de datos ni de Express: lo usa la API
// (server/adjustments.js) y lo prueban las pruebas unitarias.
// ============================================================================

export const ADJUSTMENT_TYPES = ['MERMA_DANO', 'FALTANTE', 'SOBRANTE'];
export const ADJUSTMENT_ROLES = ['Administrador', 'Encargado de Almacén'];

export const MOTIVO_MAX = 100;
export const DETALLE_MIN = 10;
export const DETALLE_MAX = 500;
export const CANTIDAD_MAX = 100000;

/**
 * Valida y normaliza los datos de un ajuste. Función pura (sin BD) para poder
 * probarla de forma unitaria. Devuelve { isValid, errors, value }.
 */
export function validateAdjustmentInput(body) {
  const data = body && typeof body === 'object' ? body : {};
  const errors = [];

  const productoId = Number(data.productoId);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    errors.push('Seleccione un producto válido.');
  }

  const tipoAjuste = typeof data.tipoAjuste === 'string' ? data.tipoAjuste.trim().toUpperCase() : '';
  if (!ADJUSTMENT_TYPES.includes(tipoAjuste)) {
    errors.push('Tipo de ajuste no válido. Use MERMA_DANO, FALTANTE o SOBRANTE.');
  }

  const rawCantidad = data.cantidad ?? data.cantidadAjuste;
  const cantidad = typeof rawCantidad === 'string' && rawCantidad.trim() === '' ? NaN : Number(rawCantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    errors.push('La cantidad del ajuste debe ser un número entero mayor a 0.');
  } else if (cantidad > CANTIDAD_MAX) {
    errors.push(`La cantidad del ajuste no puede superar ${CANTIDAD_MAX} unidades.`);
  }

  const motivo = typeof data.motivo === 'string' ? data.motivo.trim() : '';
  if (!motivo) {
    errors.push('El motivo del ajuste es obligatorio.');
  } else if (motivo.length > MOTIVO_MAX) {
    errors.push(`El motivo no puede superar ${MOTIVO_MAX} caracteres.`);
  }

  const detalle = typeof data.detalle === 'string' ? data.detalle.trim() : '';
  if (!detalle) {
    errors.push('La justificación técnica es obligatoria.');
  } else if (detalle.length < DETALLE_MIN) {
    errors.push(`La justificación técnica debe tener al menos ${DETALLE_MIN} caracteres.`);
  } else if (detalle.length > DETALLE_MAX) {
    errors.push(`La justificación técnica no puede superar ${DETALLE_MAX} caracteres.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { productoId, tipoAjuste, cantidad, motivo, detalle }
  };
}
