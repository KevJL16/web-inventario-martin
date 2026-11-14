// ============================================================================
// REGLAS DE NEGOCIO DE AJUSTES Y MERMAS (HU-004 / RF-20) — FUENTE ÚNICA
// Módulo puro, sin dependencias de base de datos, Express ni React.
// Lo usan el navegador (src/models/AdjustmentModel.js) y la API
// (server/adjustmentRules.js), para que ambos validen exactamente igual (DEF-15).
// ============================================================================

export const ADJUSTMENT_TYPES = ['MERMA_DANO', 'FALTANTE', 'SOBRANTE'];
export const ADJUSTMENT_ROLES = ['Administrador', 'Encargado de Almacén'];

// Tipos que descuentan stock
export const DECREASING_TYPES = ['MERMA_DANO', 'FALTANTE'];

// Límites alineados con las columnas de AjustesInventario
export const MOTIVO_MAX = 100;
export const DETALLE_MIN = 10;
export const DETALLE_MAX = 500;
export const CANTIDAD_MAX = 100000;

const toText = (value) => (typeof value === 'string' ? value.trim() : '');

function parseCantidad(raw) {
  if (typeof raw === 'string' && raw.trim() === '') return NaN;
  return Number(raw);
}

/**
 * Valida y normaliza los datos de un ajuste.
 * Devuelve { isValid, errors, value } sin lanzar excepciones.
 */
export function validateAdjustmentInput(body) {
  const data = body && typeof body === 'object' ? body : {};
  const errors = [];

  const productoId = Number(data.productoId);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    errors.push('Seleccione un producto válido.');
  }

  const tipoAjuste = toText(data.tipoAjuste).toUpperCase();
  if (!ADJUSTMENT_TYPES.includes(tipoAjuste)) {
    errors.push('Tipo de ajuste no válido. Use MERMA_DANO, FALTANTE o SOBRANTE.');
  }

  const cantidad = parseCantidad(data.cantidad ?? data.cantidadAjuste);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    errors.push('La cantidad del ajuste debe ser un número entero mayor a 0.');
  } else if (cantidad > CANTIDAD_MAX) {
    errors.push(`La cantidad del ajuste no puede superar ${CANTIDAD_MAX} unidades.`);
  }

  const motivo = toText(data.motivo);
  if (!motivo) {
    errors.push('El motivo del ajuste es obligatorio.');
  } else if (motivo.length > MOTIVO_MAX) {
    errors.push(`El motivo no puede superar ${MOTIVO_MAX} caracteres.`);
  }

  const detalle = toText(data.detalle);
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

/**
 * CA-3: un ajuste que descuenta no puede dejar el stock en negativo.
 * Devuelve el mensaje de error o null si el stock alcanza.
 */
export function validateStockAvailability(stockActual, tipoAjuste, cantidad) {
  if (!DECREASING_TYPES.includes(tipoAjuste)) return null;
  if (!Number.isInteger(cantidad) || cantidad <= 0) return null;
  if (cantidad > stockActual) {
    return `No se puede descontar más del stock actual (${stockActual} unid.).`;
  }
  return null;
}

/** Stock resultante de aplicar un ajuste (los tipos desconocidos no lo modifican). */
export function calculateNewStock(stockActual, tipoAjuste, cantidad) {
  const quantity = Number(cantidad);
  if (DECREASING_TYPES.includes(tipoAjuste)) return stockActual - quantity;
  if (tipoAjuste === 'SOBRANTE') return stockActual + quantity;
  return stockActual;
}
